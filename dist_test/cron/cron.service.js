"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CronService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CronService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
const telegram_service_1 = require("../telegram/telegram.service");
const config_1 = require("@nestjs/config");
let CronService = CronService_1 = class CronService {
    constructor(prisma, email, telegram, config) {
        this.prisma = prisma;
        this.email = email;
        this.telegram = telegram;
        this.config = config;
        this.logger = new common_1.Logger(CronService_1.name);
        this.LOW_STOCK_THRESHOLD = 5;
    }
    async checkLowStock() {
        this.logger.log('Running nightly low-stock check...');
        const stockCounts = await this.prisma.$queryRaw `
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
    `;
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
        const superAdmins = await this.prisma.admin.findMany({
            where: { role: 'SUPER_ADMIN', isActive: true },
            select: { email: true },
        });
        for (const admin of superAdmins) {
            await this.email.sendLowStockAlert(admin.email, { items });
        }
        await this.telegram.sendLowStockAlert({ items });
    }
    async checkSubscriptionExpiry() {
        this.logger.log('Running daily subscription expiry check...');
        const now = new Date();
        const addDays = (d, n) => {
            const r = new Date(d);
            r.setDate(r.getDate() + n);
            return r;
        };
        const expiring7 = await this.prisma.subscriptionExpiry.findMany({
            where: {
                status: { in: ['ACTIVE'] },
                reminder7Sent: false,
                expiresAt: { gte: addDays(now, 6), lte: addDays(now, 8) },
            },
        });
        for (const sub of expiring7) {
            const storefrontUrl = this.config.get('STOREFRONT_URL', 'http://localhost:3000');
            const account = await this.prisma.customerAccount.findFirst({
                where: { email: sub.customerEmail },
                select: { name: true },
            });
            const customerName = account?.name || sub.customerEmail.split('@')[0];
            await this.email.sendExpiryReminder(sub.customerEmail, {
                customerName,
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
        const expiring3 = await this.prisma.subscriptionExpiry.findMany({
            where: {
                status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
                reminder3Sent: false,
                expiresAt: { gte: addDays(now, 2), lte: addDays(now, 4) },
            },
        });
        for (const sub of expiring3) {
            const storefrontUrl = this.config.get('STOREFRONT_URL', 'http://localhost:3000');
            const account = await this.prisma.customerAccount.findFirst({
                where: { email: sub.customerEmail },
                select: { name: true },
            });
            const customerName = account?.name || sub.customerEmail.split('@')[0];
            await this.email.sendExpiryReminder(sub.customerEmail, {
                customerName,
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
        const expiring1 = await this.prisma.subscriptionExpiry.findMany({
            where: {
                status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
                reminder1Sent: false,
                expiresAt: { gte: now, lte: addDays(now, 2) },
            },
        });
        for (const sub of expiring1) {
            const storefrontUrl = this.config.get('STOREFRONT_URL', 'http://localhost:3000');
            const account = await this.prisma.customerAccount.findFirst({
                where: { email: sub.customerEmail },
                select: { name: true },
            });
            const customerName = account?.name || sub.customerEmail.split('@')[0];
            await this.email.sendExpiryReminder(sub.customerEmail, {
                customerName,
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
    async checkPendingPayments() {
        this.logger.log('Running pending payment check...');
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
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
        const Razorpay = require('razorpay');
        const rzp = new Razorpay({
            key_id: this.config.get('RAZORPAY_KEY_ID'),
            key_secret: this.config.get('RAZORPAY_KEY_SECRET'),
        });
        for (const order of staleOrders) {
            try {
                let actualStatus = 'unknown';
                if (order.paymentReference) {
                    try {
                        const rzpOrder = await rzp.orders.fetch(order.paymentReference);
                        actualStatus = rzpOrder.status;
                    }
                    catch (e) {
                        this.logger.warn(`Could not fetch Razorpay order ${order.paymentReference}: ${e.message}`);
                    }
                }
                if (actualStatus === 'paid') {
                    this.logger.warn(`Order ${order.id.slice(0, 8)} is PAID on Razorpay but PENDING in our DB — confirming now`);
                    await this.prisma.order.update({
                        where: { id: order.id },
                        data: { paymentStatus: 'CONFIRMED' },
                    });
                    await this.email.sendOrderConfirmation(order.customerEmail, {
                        customerName: order.customerName,
                        orderId: order.id,
                        serviceName: order.service.name,
                        planName: order.plan.name,
                        amount: String(order.amountPaid),
                    });
                    await this.telegram.sendUnfulfilledAlert({
                        orderId: order.id,
                        customerName: order.customerName,
                        amount: String(order.amountPaid),
                    });
                }
                else {
                    const reason = actualStatus === 'attempted'
                        ? 'Payment attempted but failed by user'
                        : 'Payment not completed within 5 minutes';
                    await this.prisma.order.delete({
                        where: { id: order.id },
                    });
                    this.logger.log(`Order ${order.id.slice(0, 8)} permanently deleted (expired): ${reason}`);
                    await this.telegram.sendPaymentExpired({
                        orderId: order.id,
                        customerName: order.customerName,
                        amount: String(order.amountPaid),
                        reason: reason,
                    });
                }
            }
            catch (err) {
                this.logger.error(`Error processing stale order ${order.id}: ${err.message}`);
            }
        }
    }
    async checkUnfulfilledOrders() {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
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
            await this.telegram.sendUnfulfilledAlert({
                orderId: order.id,
                customerName: order.customerName,
                amount: String(order.amountPaid),
            });
            await this.email.sendAdminNotification({
                subject: `🚨 URGENT: Order #${order.id.slice(0, 8)} Paid but NOT Delivered`,
                body: `Customer: ${order.customerName} (${order.customerEmail})\nService: ${order.service.name} — ${order.plan.name}\nAmount: ₹${order.amountPaid}\n\nThis order has been paid for over 5 minutes but has not been auto-delivered. Please check inventory and fulfill manually.`,
            });
            await this.email.sendOrderProcessingDelay(order.customerEmail, {
                customerName: order.customerName,
                orderId: order.id,
                serviceName: order.service.name,
                planName: order.plan.name,
            });
            await this.prisma.order.update({
                where: { id: order.id },
                data: { fulfillmentStatus: 'MANUAL_PENDING' },
            });
        }
    }
};
exports.CronService = CronService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "checkLowStock", null);
__decorate([
    (0, schedule_1.Cron)('30 4 * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "checkSubscriptionExpiry", null);
__decorate([
    (0, schedule_1.Cron)('*/5 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "checkPendingPayments", null);
__decorate([
    (0, schedule_1.Cron)('*/5 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CronService.prototype, "checkUnfulfilledOrders", null);
exports.CronService = CronService = CronService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService,
        telegram_service_1.TelegramService,
        config_1.ConfigService])
], CronService);
//# sourceMappingURL=cron.service.js.map