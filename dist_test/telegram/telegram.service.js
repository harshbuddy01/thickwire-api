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
var TelegramService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let TelegramService = TelegramService_1 = class TelegramService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(TelegramService_1.name);
        this.botToken = this.config.get('TELEGRAM_BOT_TOKEN', '');
        this.chatId = this.config.get('TELEGRAM_CHAT_ID', '');
        this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
    }
    async sendNewOrder(data) {
        return this.send(`🛒 *New Order*\nOrder: \`${data.orderId.slice(0, 8)}\`\nCustomer: ${data.customerName}\nService: ${data.serviceName} — ${data.planName}\nAmount: ₹${data.amount}`);
    }
    async sendPaymentConfirmed(data) {
        return this.send(`✅ *Payment Confirmed*\nOrder: \`${data.orderId.slice(0, 8)}\`\nAmount: ₹${data.amount}`);
    }
    async sendOrderFulfilled(data) {
        return this.send(`🎉 *Order Fulfilled*\nOrder: \`${data.orderId.slice(0, 8)}\`\nCustomer: ${data.customerName}`);
    }
    async sendOutOfStock(data) {
        return this.send(`⚠️ *Out of Stock*\nOrder: \`${data.orderId.slice(0, 8)}\`\nPlan: ${data.planName}\nManual fulfillment required!`);
    }
    async sendLowStockAlert(data) {
        const list = data.items.map((i) => `• ${i.planName}: *${i.count}* left`).join('\n');
        return this.send(`⚠️ *Low Stock Alert*\n${list}`);
    }
    async sendPaymentFailed(data) {
        return this.send(`❌ *Payment Failed*\nOrder: \`${data.orderId.slice(0, 8)}\`\nCustomer: ${data.customerName}\nReason: ${data.reason}`);
    }
    async sendPaymentExpired(data) {
        return this.send(`⏰ *Order Auto-Cancelled*\nOrder: \`${data.orderId.slice(0, 8)}\`\nCustomer: ${data.customerName}\nAmount: ₹${data.amount}\nReason: ${data.reason}`);
    }
    async sendUnfulfilledAlert(data) {
        return this.send(`🚨 *URGENT: Payment Confirmed But NOT Delivered*\nOrder: \`${data.orderId.slice(0, 8)}\`\nCustomer: ${data.customerName}\nAmount: ₹${data.amount}\nAction required immediately!`);
    }
    async testConnection() {
        try {
            await this.send('🔔 ThickWire bot connection test successful!');
            return true;
        }
        catch {
            return false;
        }
    }
    async send(text) {
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
        }
        catch (err) {
            this.logger.error(`Telegram error: ${err.message}`);
            return false;
        }
    }
};
exports.TelegramService = TelegramService;
exports.TelegramService = TelegramService = TelegramService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], TelegramService);
//# sourceMappingURL=telegram.service.js.map