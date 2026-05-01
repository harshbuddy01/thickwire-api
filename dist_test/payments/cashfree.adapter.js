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
var CashfreeAdapter_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashfreeAdapter = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const crypto = require("crypto");
let CashfreeAdapter = CashfreeAdapter_1 = class CashfreeAdapter {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(CashfreeAdapter_1.name);
        this.appId = this.config.get('CASHFREE_APP_ID', '');
        this.secretKey = this.config.get('CASHFREE_SECRET_KEY', '');
        this.webhookSecret = this.config.get('CASHFREE_WEBHOOK_SECRET', '');
        this.apiUrl = this.config.get('NODE_ENV') === 'production'
            ? 'https://api.cashfree.com/pg'
            : 'https://sandbox.cashfree.com/pg';
    }
    async createOrder(orderId, amount, currency, customerDetails) {
        if (!this.appId) {
            this.logger.warn('CASHFREE_APP_ID not configured');
            return null;
        }
        const response = await fetch(`${this.apiUrl}/orders`, {
            method: 'POST',
            headers: {
                'x-api-version': '2023-08-01',
                'x-client-id': this.appId,
                'x-client-secret': this.secretKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                order_id: orderId,
                order_amount: amount,
                order_currency: currency || 'INR',
                customer_details: {
                    customer_id: customerDetails.email,
                    customer_name: customerDetails.name,
                    customer_email: customerDetails.email,
                    customer_phone: customerDetails.phone,
                },
                order_meta: {
                    return_url: `${this.config.get('STOREFRONT_URL', 'http://localhost:3000')}/order/${orderId}?gateway=cashfree`,
                },
            }),
        });
        const data = await response.json();
        if (!response.ok) {
            this.logger.error(`Cashfree createOrder failed: ${JSON.stringify(data)}`);
            return null;
        }
        this.logger.log(`Cashfree order created: ${data.cf_order_id}`);
        return {
            cfOrderId: data.cf_order_id,
            paymentSessionId: data.payment_session_id,
            orderId: data.order_id,
        };
    }
    verifyWebhook(rawBody, signature) {
        if (!this.webhookSecret)
            return false;
        const computed = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(rawBody)
            .digest('base64');
        return computed === signature;
    }
};
exports.CashfreeAdapter = CashfreeAdapter;
exports.CashfreeAdapter = CashfreeAdapter = CashfreeAdapter_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CashfreeAdapter);
//# sourceMappingURL=cashfree.adapter.js.map