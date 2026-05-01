import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class WhatsappService {
    private readonly config;
    private readonly prisma;
    private readonly logger;
    private readonly apiKey;
    private readonly senderNumber;
    constructor(config: ConfigService, prisma: PrismaService);
    sendTemplate(phone: string, templateName: string, params: string[]): Promise<boolean>;
    sendOrderDelivered(phone: string, data: {
        customerName: string;
        serviceName: string;
        planName: string;
        credentialInfo: string;
        expiryDate: string;
    }): Promise<boolean>;
    sendOrderProcessing(phone: string, data: {
        customerName: string;
        orderId: string;
        serviceName: string;
        planName: string;
    }): Promise<boolean>;
    sendExpiryReminder(phone: string, data: {
        customerName: string;
        serviceName: string;
        planName: string;
        expiryDate: string;
        renewalLink: string;
    }, daysLeft: number): Promise<boolean>;
    sendSubscriptionExpired(phone: string, data: {
        customerName: string;
        serviceName: string;
        planName: string;
        renewalLink: string;
    }): Promise<boolean>;
    private logNotification;
}
