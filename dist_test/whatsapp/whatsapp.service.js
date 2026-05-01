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
var WhatsappService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
let WhatsappService = WhatsappService_1 = class WhatsappService {
    constructor(config, prisma) {
        this.config = config;
        this.prisma = prisma;
        this.logger = new common_1.Logger(WhatsappService_1.name);
        this.apiKey = this.config.get('INTERAKT_API_KEY', '');
        this.senderNumber = this.config.get('INTERAKT_SENDER_NUMBER', '');
    }
    async sendTemplate(phone, templateName, params) {
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
            }
            else {
                this.logger.error(`WhatsApp failed to ${phone}: ${response.status}`);
            }
            return success;
        }
        catch (err) {
            this.logger.error(`WhatsApp error for ${phone}: ${err.message}`);
            await this.logNotification(templateName, phone, 'failed');
            return false;
        }
    }
    async sendOrderDelivered(phone, data) {
        return this.sendTemplate(phone, 'order_delivered', [data.customerName, data.serviceName, data.planName, data.credentialInfo, data.expiryDate]);
    }
    async sendOrderProcessing(phone, data) {
        return this.sendTemplate(phone, 'order_processing', [data.customerName, data.orderId, data.serviceName, data.planName]);
    }
    async sendExpiryReminder(phone, data, daysLeft) {
        const templateMap = { 7: 'expiry_reminder_7', 3: 'expiry_reminder_3', 1: 'expiry_reminder_1' };
        const template = templateMap[daysLeft] || 'expiry_reminder_7';
        return this.sendTemplate(phone, template, [data.customerName, data.serviceName, data.planName, data.expiryDate, data.renewalLink]);
    }
    async sendSubscriptionExpired(phone, data) {
        return this.sendTemplate(phone, 'subscription_expired', [data.customerName, data.serviceName, data.planName, data.renewalLink]);
    }
    async logNotification(templateName, recipient, status) {
        try {
            await this.prisma.notificationLog.create({
                data: { channel: 'whatsapp', templateName, recipient, status },
            });
        }
        catch (err) {
            this.logger.error(`Failed to log WhatsApp notification: ${err.message}`);
        }
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = WhatsappService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map