import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TelegramService {
    private readonly logger = new Logger(TelegramService.name);
    private readonly botToken: string;
    private readonly chatId: string;
    private readonly baseUrl: string;

    constructor(private readonly config: ConfigService) {
        this.botToken = this.config.get('TELEGRAM_BOT_TOKEN', '');
        this.chatId = this.config.get('TELEGRAM_CHAT_ID', '');
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    }

    async sendNewOrder(data: { orderId: string; customerName: string; serviceName: string; planName: string; amount: string }) {
        return this.send(
            `🛒 *New Order*\nOrder: \`${data.orderId.slice(0, 8)}\`\nCustomer: ${data.customerName}\nService: ${data.serviceName} — ${data.planName}\nAmount: ₹${data.amount}`,
        );
    }

    async sendPaymentConfirmed(data: { orderId: string; amount: string }) {
        return this.send(
            `✅ *Payment Confirmed*\nOrder: \`${data.orderId.slice(0, 8)}\`\nAmount: ₹${data.amount}`,
        );
    }

    async sendOrderFulfilled(data: { orderId: string; customerName: string }) {
        return this.send(
            `🎉 *Order Fulfilled*\nOrder: \`${data.orderId.slice(0, 8)}\`\nCustomer: ${data.customerName}`,
        );
    }

    async sendOutOfStock(data: { orderId: string; planName: string }) {
        return this.send(
            `⚠️ *Out of Stock*\nOrder: \`${data.orderId.slice(0, 8)}\`\nPlan: ${data.planName}\nManual fulfillment required!`,
        );
    }

    async sendLowStockAlert(data: { items: { planName: string; count: number }[] }) {
        const list = data.items.map((i) => `• ${i.planName}: *${i.count}* left`).join('\n');
        return this.send(`⚠️ *Low Stock Alert*\n${list}`);
    }

    async sendPaymentFailed(data: { orderId: string; customerName: string; reason: string }) {
        return this.send(
            `❌ *Payment Failed*\nOrder: \`${data.orderId.slice(0, 8)}\`\nCustomer: ${data.customerName}\nReason: ${data.reason}`,
        );
    }

    async sendPaymentExpired(data: { orderId: string; customerName: string; amount: string; reason: string }) {
        return this.send(
            `⏰ *Order Auto-Cancelled*\nOrder: \`${data.orderId.slice(0, 8)}\`\nCustomer: ${data.customerName}\nAmount: ₹${data.amount}\nReason: ${data.reason}`,
        );
    }

    async sendUnfulfilledAlert(data: { orderId: string; customerName: string; amount: string }) {
        return this.send(
            `🚨 *URGENT: Payment Confirmed But NOT Delivered*\nOrder: \`${data.orderId.slice(0, 8)}\`\nCustomer: ${data.customerName}\nAmount: ₹${data.amount}\nAction required immediately!`,
        );
    }

    async sendCredentialSubmission(data: { orderId: string; customerName: string; customerEmail: string; serviceName: string; credentials: Record<string, any> }) {
        const credLines = Object.entries(data.credentials)
            .map(([key, val]) => `  • ${key}: \`${key.toLowerCase().includes('password') ? '*****' : val}\``)
            .join('\n');
        return this.send(
            `🔐 *New ${data.serviceName} Credentials Received*\nOrder: \`${data.orderId.slice(0, 8)}\`\nCustomer: ${data.customerName}\nEmail: ${data.customerEmail}\n\nCredentials:\n${credLines}`,
        );
    }

    async sendActivationLinkSent(data: { orderId: string; customerEmail: string; link: string }) {
        return this.send(
            `🔗 *Activation Link Sent*\nOrder: \`${data.orderId.slice(0, 8)}\`\nTo: ${data.customerEmail}\nLink: ${data.link}`,
        );
    }

    async testConnection(): Promise<boolean> {
        try {
            await this.send('🔔 ThickWire bot connection test successful!');
            return true;
        } catch {
            return false;
        }
    }

    private async send(text: string): Promise<boolean> {
        if (!this.botToken || !this.chatId) {
            this.logger.warn('Telegram not configured, skipping');
            return false;
        }

        try {
            const res = await fetch(`${this.baseUrl}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.chatId,
                    text,
                    parse_mode: 'Markdown',
                }),
            });

            if (!res.ok) {
                const err = await res.text();
                this.logger.error(`Telegram send failed: ${err}`);
                return false;
            }

            return true;
        } catch (err) {
            this.logger.error(`Telegram error: ${(err as Error).message}`);
            return false;
        }
    }
}
