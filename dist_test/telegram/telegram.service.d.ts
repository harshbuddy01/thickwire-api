import { ConfigService } from '@nestjs/config';
export declare class TelegramService {
    private readonly config;
    private readonly logger;
    private readonly botToken;
    private readonly chatId;
    private readonly baseUrl;
    constructor(config: ConfigService);
    sendNewOrder(data: {
        orderId: string;
        customerName: string;
        serviceName: string;
        planName: string;
        amount: string;
    }): Promise<boolean>;
    sendPaymentConfirmed(data: {
        orderId: string;
        amount: string;
    }): Promise<boolean>;
    sendOrderFulfilled(data: {
        orderId: string;
        customerName: string;
    }): Promise<boolean>;
    sendOutOfStock(data: {
        orderId: string;
        planName: string;
    }): Promise<boolean>;
    sendLowStockAlert(data: {
        items: {
            planName: string;
            count: number;
        }[];
    }): Promise<boolean>;
    sendPaymentFailed(data: {
        orderId: string;
        customerName: string;
        reason: string;
    }): Promise<boolean>;
    sendPaymentExpired(data: {
        orderId: string;
        customerName: string;
        amount: string;
        reason: string;
    }): Promise<boolean>;
    sendUnfulfilledAlert(data: {
        orderId: string;
        customerName: string;
        amount: string;
    }): Promise<boolean>;
    testConnection(): Promise<boolean>;
    private send;
}
