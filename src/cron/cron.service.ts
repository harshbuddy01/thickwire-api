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

    // ─── Phase 3: Pending Payment Auto-Cancel (every 5 minutes) ──────
    @Cron('*/5 * * * *')
    async checkPendingPayments() {
        this.logger.log('Running pending payment check...');
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        // Find all orders that are PENDING and older than 5 minutes
        const staleOrders = await this.prisma.order.findMany({
            where: {
                paymentStatus: 'PENDING',
                createdAt: { lte: fiveMinutesAgo },
            },
            include: {
                service: { select: { name: true } },
                plan: { select: { name: true } },
            },
        });

        if (staleOrders.length === 0) {
            this.logger.log('No stale pending orders found');
            return;
        }

        this.logger.warn(`Found ${staleOrders.length} stale pending orders`);

        // Lazy init Razorpay
        const Razorpay = require('razorpay');
        const rzp = new Razorpay({
            key_id: this.config.get('RAZORPAY_KEY_ID'),
            key_secret: this.config.get('RAZORPAY_KEY_SECRET'),
        });

        for (const order of staleOrders) {
            try {
                let actualStatus: 'paid' | 'attempted' | 'created' | 'unknown' = 'unknown';

                // Check with Razorpay if we have a payment reference
                if (order.paymentReference) {
                    try {
                        const rzpOrder = await rzp.orders.fetch(order.paymentReference);
                        actualStatus = rzpOrder.status; // 'created', 'attempted', 'paid'
                    } catch (e) {
                        this.logger.warn(`Could not fetch Razorpay order ${order.paymentReference}: ${(e as Error).message}`);
                    }
                }

                if (actualStatus === 'paid') {
                    // Payment was actually captured but webhook missed — confirm it!
                    this.logger.warn(`Order ${order.id.slice(0, 8)} is PAID on Razorpay but PENDING in our DB — confirming now`);
                    await this.prisma.order.update({
                        where: { id: order.id },
                        data: { paymentStatus: 'CONFIRMED' },
                    });

                    // Send confirmation email
                    await this.email.sendOrderConfirmation(order.customerEmail, {
                        customerName: order.customerName,
                        orderId: order.id,
                        serviceName: order.service.name,
                        planName: order.plan.name,
                        amount: String(order.amountPaid),
                    });

                    // Alert Telegram about missed webhook
                    await this.telegram.sendUnfulfilledAlert({
                        orderId: order.id,
                        customerName: order.customerName,
                        amount: String(order.amountPaid),
                    });
                } else {
                    // Payment was NOT completed — auto-cancel (EXPIRED)
                    const reason = actualStatus === 'attempted'
                        ? 'Payment attempted but failed by user'
                        : 'Payment not completed within 5 minutes';

                    await this.prisma.order.update({
                        where: { id: order.id },
                        data: { paymentStatus: 'EXPIRED' },
                    });

                    this.logger.log(`Order ${order.id.slice(0, 8)} auto-cancelled: ${reason}`);

                    // Notify admin via Telegram
                    await this.telegram.sendPaymentExpired({
                        orderId: order.id,
                        customerName: order.customerName,
                        amount: String(order.amountPaid),
                    });
                }
            } catch (err) {
                this.logger.error(`Error processing stale order ${order.id}: ${(err as Error).message}`);
            }
        }
    }

    // ─── Phase 3: Unfulfilled Order Alert (every 5 minutes) ──────
    @Cron('*/5 * * * *')
    async checkUnfulfilledOrders() {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        // Find orders that are CONFIRMED but not delivered after 5 minutes
        const unfulfilledOrders = await this.prisma.order.findMany({
            where: {
                paymentStatus: 'CONFIRMED',
                fulfillmentStatus: 'PENDING',
                deliveredAt: null,
                createdAt: { lte: fiveMinutesAgo },
            },
            include: {
                service: { select: { name: true } },
                plan: { select: { name: true } },
            },
        });

        for (const order of unfulfilledOrders) {
            this.logger.warn(`URGENT: Order ${order.id.slice(0, 8)} is CONFIRMED but NOT DELIVERED`);

            // Alert admin via Telegram
            await this.telegram.sendUnfulfilledAlert({
                orderId: order.id,
                customerName: order.customerName,
                amount: String(order.amountPaid),
            });

            // Send email to admin
            await this.email.sendAdminNotification({
                subject: `🚨 URGENT: Order #${order.id.slice(0, 8)} Paid but NOT Delivered`,
                body: `Customer: ${order.customerName} (${order.customerEmail})\nService: ${order.service.name} — ${order.plan.name}\nAmount: ₹${order.amountPaid}\n\nThis order has been paid for over 5 minutes but has not been auto-delivered. Please check inventory and fulfill manually.`,
            });

            // Mark fulfillment as MANUAL_PENDING so we don't re-alert
            await this.prisma.order.update({
                where: { id: order.id },
                data: { fulfillmentStatus: 'MANUAL_PENDING' },
            });
        }
    }
}
