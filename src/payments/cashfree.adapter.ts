import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

/**
 * Phase 2: Cashfree Payment Gateway Adapter
 * Implements the same conceptual PaymentGateway interface as Razorpay.
 */
@Injectable()
export class CashfreeAdapter {
    private readonly logger = new Logger(CashfreeAdapter.name);
    private readonly appId: string;
    private readonly secretKey: string;
    private readonly webhookSecret: string;
    private readonly apiUrl: string;

    constructor(private readonly config: ConfigService) {
        this.appId = this.config.get('CASHFREE_APP_ID', '');
        this.secretKey = this.config.get('CASHFREE_SECRET_KEY', '');
        this.webhookSecret = this.config.get('CASHFREE_WEBHOOK_SECRET', '');
        // Use sandbox in non-production
        this.apiUrl = this.config.get('NODE_ENV') === 'production'
            ? 'https://api.cashfree.com/pg'
            : 'https://sandbox.cashfree.com/pg';
    }

    /**
     * Create a Cashfree order and return session details for frontend checkout.
     */
    async createOrder(orderId: string, amount: number, currency: string, customerDetails: {
        name: string;
        email: string;
        phone: string;
    }) {
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

        const data = await response.json() as any;

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

    /**
     * Verify Cashfree webhook signature using HMAC-SHA256.
     */
    verifyWebhook(rawBody: string, signature: string): boolean {
        if (!this.webhookSecret) return false;

        const computed = crypto
            .createHmac('sha256', this.webhookSecret)
            .update(rawBody)
            .digest('base64');

        return computed === signature;
    }
}
