import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WhatsappService {
    private readonly logger = new Logger(WhatsappService.name);
    private readonly apiKey: string;
    private readonly senderNumber: string;

    constructor(
        private readonly config: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        this.apiKey = this.config.get('INTERAKT_API_KEY', '');
        this.senderNumber = this.config.get('INTERAKT_SENDER_NUMBER', '');
    }

    /**
     * Send a WhatsApp template message via Interakt BSP API.
     * Non-blocking — logs but never throws.
     */
    async sendTemplate(phone: string, templateName: string, params: string[]): Promise<boolean> {
        if (!this.apiKey) {
            this.logger.warn('INTERAKT_API_KEY not configured, skipping WhatsApp');
            return false;
        }

        try {
            const response = await fetch('https://api.interakt.ai/v1/public/message/', {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${Buffer.from(this.apiKey).toString('base64')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    countryCode: '+91',
                    phoneNumber: phone.replace(/^\+91/, ''),
                    callbackData: 'thickwire_notification',
                    type: 'Template',
                    template: {
                        name: templateName,
                        languageCode: 'en',
                        bodyValues: params,
                    },
                }),
            });

            const success = response.ok;
            await this.logNotification(templateName, phone, success ? 'sent' : 'failed');
            if (success) {
                this.logger.log(`WhatsApp sent to ${phone}: ${templateName}`);
            } else {
                this.logger.error(`WhatsApp failed to ${phone}: ${response.status}`);
            }
            return success;
        } catch (err) {
            this.logger.error(`WhatsApp error for ${phone}: ${(err as Error).message}`);
            await this.logNotification(templateName, phone, 'failed');
            return false;
        }
    }

    // ── Convenience Methods for Each Event ─────────────

    async sendOrderDelivered(phone: string, data: { customerName: string; serviceName: string; planName: string; credentialInfo: string; expiryDate: string }) {
        return this.sendTemplate(phone, 'order_delivered', [data.customerName, data.serviceName, data.planName, data.credentialInfo, data.expiryDate]);
    }

    async sendOrderProcessing(phone: string, data: { customerName: string; orderId: string; serviceName: string; planName: string }) {
        return this.sendTemplate(phone, 'order_processing', [data.customerName, data.orderId, data.serviceName, data.planName]);
    }

    async sendExpiryReminder(phone: string, data: { customerName: string; serviceName: string; planName: string; expiryDate: string; renewalLink: string }, daysLeft: number) {
        const templateMap: Record<number, string> = { 7: 'expiry_reminder_7', 3: 'expiry_reminder_3', 1: 'expiry_reminder_1' };
        const template = templateMap[daysLeft] || 'expiry_reminder_7';
        return this.sendTemplate(phone, template, [data.customerName, data.serviceName, data.planName, data.expiryDate, data.renewalLink]);
    }

    async sendSubscriptionExpired(phone: string, data: { customerName: string; serviceName: string; planName: string; renewalLink: string }) {
        return this.sendTemplate(phone, 'subscription_expired', [data.customerName, data.serviceName, data.planName, data.renewalLink]);
    }

    // ── Logging ────────────────────────────────────────
    private async logNotification(templateName: string, recipient: string, status: string) {
        try {
            await this.prisma.notificationLog.create({
                data: { channel: 'whatsapp', templateName, recipient, status },
            });
        } catch (err) {
            this.logger.error(`Failed to log WhatsApp notification: ${(err as Error).message}`);
        }
    }
}
