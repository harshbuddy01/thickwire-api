import { ConfigService } from '@nestjs/config';
export declare class CashfreeAdapter {
    private readonly config;
    private readonly logger;
    private readonly appId;
    private readonly secretKey;
    private readonly webhookSecret;
    private readonly apiUrl;
    constructor(config: ConfigService);
    createOrder(orderId: string, amount: number, currency: string, customerDetails: {
        name: string;
        email: string;
        phone: string;
    }): Promise<{
        cfOrderId: any;
        paymentSessionId: any;
        orderId: any;
    } | null>;
    verifyWebhook(rawBody: string, signature: string): boolean;
}
