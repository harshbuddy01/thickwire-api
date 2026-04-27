import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { TelegramService } from '../telegram/telegram.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';

@Injectable()
export class NotificationService {
    private readonly logger = new Logger(NotificationService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly email: EmailService,
        private readonly telegram: TelegramService,
        private readonly whatsapp: WhatsappService,
    ) { }

    async sendOrderDelivered(order: any, content: string) {
        const service = await this.prisma.service.findUnique({ where: { id: order.serviceId } });
        const plan = await this.prisma.plan.findUnique({ where: { id: order.planId } });

        // Email
        const emailSent = await this.email.sendDelivery(order.customerEmail, {
            customerName: order.customerName,
            orderId: order.id,
            serviceName: service?.name || 'N/A',
            planName: plan?.name || 'N/A',
            content,
        });

        await this.logNotification(order.id, 'email', order.customerEmail, 'delivery', emailSent);

        // Telegram
        const tgSent = await this.telegram.sendOrderFulfilled({
            orderId: order.id,
            customerName: order.customerName,
        });

        await this.logNotification(order.id, 'telegram', 'admin-group', 'order_fulfilled', tgSent);

        // WhatsApp
        if (order.whatsappOptedIn && order.customerPhone) {
            // Note: SubscriptionExpiry details will be fetched later in cron, we can use placeholder or basic order delivered template
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

    async sendOutOfStock(order: any) {
        const plan = await this.prisma.plan.findUnique({ where: { id: order.planId } });
        const service = await this.prisma.service.findUnique({ where: { id: order.serviceId } });

        // Email to customer
        const emailSent = await this.email.sendOutOfStock(order.customerEmail, {
            orderId: order.id,
            serviceName: service?.name || 'N/A',
            planName: plan?.name || 'N/A',
        });

        await this.logNotification(order.id, 'email', order.customerEmail, 'out_of_stock', emailSent);

        // Telegram alert to admin
        const tgSent = await this.telegram.sendOutOfStock({
            orderId: order.id,
            planName: plan?.name || 'N/A',
        });

        await this.logNotification(order.id, 'telegram', 'admin-group', 'out_of_stock', tgSent);
    }

    async sendPaymentConfirmed(order: any) {
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

        // WhatsApp processing alert
        if (order.whatsappOptedIn && order.customerPhone) {
            await this.whatsapp.sendOrderProcessing(order.customerPhone, {
                customerName: order.customerName,
                orderId: order.id,
                serviceName: service?.name || 'N/A',
                planName: plan?.name || 'N/A'
            });
        }
    }

    private async logNotification(
        orderId: string | null,
        channel: string,
        recipient: string,
        templateName: string,
        success: boolean,
    ) {
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
        } catch (err) {
            this.logger.error(`Failed to log notification: ${(err as Error).message}`);
        }
    }
}
