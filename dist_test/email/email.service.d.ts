import { ConfigService } from '@nestjs/config';
export declare class EmailService {
    private readonly config;
    private readonly logger;
    private transporter;
    private fromEmail;
    private supportEmail;
    private ordersEmail;
    constructor(config: ConfigService);
    sendOrderConfirmation(to: string, data: {
        customerName: string;
        orderId: string;
        serviceName: string;
        planName: string;
        amount: string;
    }): Promise<boolean>;
    sendDelivery(to: string, data: {
        customerName: string;
        orderId: string;
        serviceName: string;
        planName: string;
        content: string;
    }): Promise<boolean>;
    sendOutOfStock(to: string, data: {
        orderId: string;
        serviceName: string;
        planName: string;
    }): Promise<boolean>;
    sendSupportAutoReply(to: string, data: {
        customerName: string;
        ticketId: string;
        subject: string;
    }): Promise<boolean>;
    sendSupportReply(to: string, data: {
        customerName: string;
        ticketId: string;
        subject: string;
        replyText: string;
    }): Promise<boolean>;
    sendLowStockAlert(to: string, data: {
        items: {
            serviceName: string;
            planName: string;
            count: number;
        }[];
    }): Promise<boolean>;
    sendAdminNotification(data: {
        subject: string;
        body: string;
    }): Promise<boolean>;
    sendVerification(to: string, data: {
        customerName: string;
        verifyUrl: string;
    }): Promise<boolean>;
    sendWelcome(to: string, data: {
        customerName: string;
    }): Promise<boolean>;
    sendPasswordReset(to: string, data: {
        customerName: string;
        resetUrl: string;
    }): Promise<boolean>;
    sendExpiryReminder(to: string, data: {
        customerName: string;
        serviceName: string;
        planName: string;
        expiryDate: string;
        daysLeft: number;
        renewUrl: string;
    }): Promise<boolean>;
    sendOrderProcessingDelay(to: string, data: {
        customerName: string;
        orderId: string;
        serviceName: string;
        planName: string;
    }): Promise<boolean>;
    private send;
    private tplOrderConfirmation;
    private tplDelivery;
    private tplOutOfStock;
    private tplSupportAutoReply;
    private tplLowStock;
}
