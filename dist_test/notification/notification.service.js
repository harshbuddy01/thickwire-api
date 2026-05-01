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
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
const telegram_service_1 = require("../telegram/telegram.service");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
let NotificationService = NotificationService_1 = class NotificationService {
    constructor(prisma, email, telegram, whatsapp) {
        this.prisma = prisma;
        this.email = email;
        this.telegram = telegram;
        this.whatsapp = whatsapp;
        this.logger = new common_1.Logger(NotificationService_1.name);
    }
    async sendOrderDelivered(order, content) {
        const service = await this.prisma.service.findUnique({ where: { id: order.serviceId } });
        const plan = await this.prisma.plan.findUnique({ where: { id: order.planId } });
        const emailSent = await this.email.sendDelivery(order.customerEmail, {
            customerName: order.customerName,
            orderId: order.id,
            serviceName: service?.name || 'N/A',
            planName: plan?.name || 'N/A',
            content,
        });
        await this.logNotification(order.id, 'email', order.customerEmail, 'delivery', emailSent);
        const tgSent = await this.telegram.sendOrderFulfilled({
            orderId: order.id,
            customerName: order.customerName,
        });
        await this.logNotification(order.id, 'telegram', 'admin-group', 'order_fulfilled', tgSent);
        if (order.whatsappOptedIn && order.customerPhone) {
            const expiryDateStr = order.expiresAt ? new Date(order.expiresAt).toLocaleDateString() : 'N/A';
            const renewalLink = `${process.env.STOREFRONT_URL || 'http://localhost:3000'}/account`;
            await this.whatsapp.sendOrderDelivered(order.customerPhone, {
                customerName: order.customerName,
                serviceName: service?.name || 'N/A',
                planName: plan?.name || 'N/A',
                credentialInfo: 'Details sent to your registered email.',
                expiryDate: expiryDateStr
            });
        }
    }
    async sendOutOfStock(order) {
        const plan = await this.prisma.plan.findUnique({ where: { id: order.planId } });
        const service = await this.prisma.service.findUnique({ where: { id: order.serviceId } });
        const emailSent = await this.email.sendOutOfStock(order.customerEmail, {
            orderId: order.id,
            serviceName: service?.name || 'N/A',
            planName: plan?.name || 'N/A',
        });
        await this.logNotification(order.id, 'email', order.customerEmail, 'out_of_stock', emailSent);
        const tgSent = await this.telegram.sendOutOfStock({
            orderId: order.id,
            planName: plan?.name || 'N/A',
        });
        await this.logNotification(order.id, 'telegram', 'admin-group', 'out_of_stock', tgSent);
    }
    async sendPaymentConfirmed(order) {
        const service = await this.prisma.service.findUnique({ where: { id: order.serviceId } });
        const plan = await this.prisma.plan.findUnique({ where: { id: order.planId } });
        const emailSent = await this.email.sendOrderConfirmation(order.customerEmail, {
            customerName: order.customerName,
            orderId: order.id,
            serviceName: service?.name || 'N/A',
            planName: plan?.name || 'N/A',
            amount: String(order.amountPaid),
        });
        await this.logNotification(order.id, 'email', order.customerEmail, 'order_confirmation', emailSent);
        const tgSent = await this.telegram.sendPaymentConfirmed({
            orderId: order.id,
            amount: String(order.amountPaid),
        });
        await this.logNotification(order.id, 'telegram', 'admin-group', 'payment_confirmed', tgSent);
        if (order.whatsappOptedIn && order.customerPhone) {
            await this.whatsapp.sendOrderProcessing(order.customerPhone, {
                customerName: order.customerName,
                orderId: order.id,
                serviceName: service?.name || 'N/A',
                planName: plan?.name || 'N/A'
            });
        }
    }
    async logNotification(orderId, channel, recipient, templateName, success) {
        try {
            await this.prisma.notificationLog.create({
                data: {
                    orderId,
                    channel,
                    recipient,
                    templateName,
                    status: success ? 'sent' : 'failed',
                },
            });
        }
        catch (err) {
            this.logger.error(`Failed to log notification: ${err.message}`);
        }
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService,
        telegram_service_1.TelegramService,
        whatsapp_service_1.WhatsappService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map