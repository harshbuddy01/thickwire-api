import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { TelegramService } from '../telegram/telegram.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CronService {
    private readonly logger = new Logger(CronService.name);
    private readonly LOW_STOCK_THRESHOLD = 5;

    constructor(
        private readonly prisma: PrismaService,
        private readonly email: EmailService,
        private readonly telegram: TelegramService,
        private readonly config: ConfigService,
    ) { }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async checkLowStock() {
        this.logger.log('Running nightly low-stock check...');

        const stockCounts = await this.prisma.$queryRaw`
      SELECT 
        p.id as "planId",
        p.name as "planName",
        s.name as "serviceName",
        COUNT(i.id)::int as available
      FROM "Plan" p
      JOIN "Service" s ON s.id = p."serviceId"
      LEFT JOIN "Inventory" i ON i."planId" = p.id AND i."isUsed" = false
      WHERE p."isActive" = true AND p."deletedAt" IS NULL
        AND s."isActive" = true AND s."deletedAt" IS NULL
      GROUP BY p.id, p.name, s.name
      HAVING COUNT(i.id) <= ${this.LOW_STOCK_THRESHOLD}
      ORDER BY available ASC
    ` as { planId: string; planName: string; serviceName: string; available: number }[];

        if (stockCounts.length === 0) {
            this.logger.log('No low-stock items found');
            return;
        }

        this.logger.warn(`Found ${stockCounts.length} low-stock plans`);

        const items = stockCounts.map((c) => ({
            serviceName: c.serviceName,
            planName: c.planName,
            count: c.available,
        }));

        // Email alert to all super admins
        const superAdmins = await this.prisma.admin.findMany({
            where: { role: 'SUPER_ADMIN', isActive: true },
            select: { email: true },
        });

        for (const admin of superAdmins) {
            await this.email.sendLowStockAlert(admin.email, { items });
        }

        // Telegram alert
        await this.telegram.sendLowStockAlert({ items });
    }

    // ─── Phase 2: Subscription Expiry Cron ──────────────
    // Runs daily at 10:00 AM IST (04:30 UTC)
    @Cron('30 4 * * *')
    async checkSubscriptionExpiry() {
        this.logger.log('Running daily subscription expiry check...');
        const now = new Date();

        // Helper: date X days from now
        const addDays = (d: Date, n: number) => {
            const r = new Date(d);
            r.setDate(r.getDate() + n);
            return r;
        };

        // 7-day reminder
        const expiring7 = await this.prisma.subscriptionExpiry.findMany({
            where: {
                status: { in: ['ACTIVE'] },
                reminder7Sent: false,
                expiresAt: { gte: addDays(now, 6), lte: addDays(now, 8) },
            },
        });
        for (const sub of expiring7) {
            const storefrontUrl = this.config.get('STOREFRONT_URL', 'http://localhost:3000');
            await this.email.sendExpiryReminder(sub.customerEmail, {
                customerName: sub.customerEmail.split('@')[0],
                serviceName: sub.serviceName,
                planName: sub.planName,
                expiryDate: sub.expiresAt.toLocaleDateString('en-IN'),
                daysLeft: 7,
                renewUrl: `${storefrontUrl}`,
            });
            await this.prisma.subscriptionExpiry.update({
                where: { id: sub.id },
                data: { reminder7Sent: true, status: 'EXPIRING_SOON' },
            });
        }

        // 3-day reminder
        const expiring3 = await this.prisma.subscriptionExpiry.findMany({
            where: {
                status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
                reminder3Sent: false,
                expiresAt: { gte: addDays(now, 2), lte: addDays(now, 4) },
            },
        });
        for (const sub of expiring3) {
            const storefrontUrl = this.config.get('STOREFRONT_URL', 'http://localhost:3000');
            await this.email.sendExpiryReminder(sub.customerEmail, {
                customerName: sub.customerEmail.split('@')[0],
                serviceName: sub.serviceName,
                planName: sub.planName,
                expiryDate: sub.expiresAt.toLocaleDateString('en-IN'),
                daysLeft: 3,
                renewUrl: `${storefrontUrl}`,
            });
            await this.prisma.subscriptionExpiry.update({
                where: { id: sub.id },
                data: { reminder3Sent: true, status: 'EXPIRING_SOON' },
            });
        }

        // 1-day reminder
        const expiring1 = await this.prisma.subscriptionExpiry.findMany({
            where: {
                status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
                reminder1Sent: false,
                expiresAt: { gte: now, lte: addDays(now, 2) },
            },
        });
        for (const sub of expiring1) {
            const storefrontUrl = this.config.get('STOREFRONT_URL', 'http://localhost:3000');
            await this.email.sendExpiryReminder(sub.customerEmail, {
                customerName: sub.customerEmail.split('@')[0],
                serviceName: sub.serviceName,
                planName: sub.planName,
                expiryDate: sub.expiresAt.toLocaleDateString('en-IN'),
                daysLeft: 1,
                renewUrl: `${storefrontUrl}`,
            });
            await this.prisma.subscriptionExpiry.update({
                where: { id: sub.id },
                data: { reminder1Sent: true },
            });
        }

        // Mark expired
        const expired = await this.prisma.subscriptionExpiry.updateMany({
            where: {
                status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
                expiresAt: { lte: now },
            },
            data: { status: 'EXPIRED' },
        });

        if (expired.count > 0) {
            this.logger.warn(`Marked ${expired.count} subscriptions as expired`);
        }

        this.logger.log(`Expiry check complete: ${expiring7.length} 7d, ${expiring3.length} 3d, ${expiring1.length} 1d, ${expired.count} expired`);
    }
}

