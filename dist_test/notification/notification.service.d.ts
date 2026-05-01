import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { TelegramService } from '../telegram/telegram.service';
import { WhatsappService } from '../whatsapp/whatsapp.service';
export declare class NotificationService {
    private readonly prisma;
    private readonly email;
    private readonly telegram;
    private readonly whatsapp;
    private readonly logger;
    constructor(prisma: PrismaService, email: EmailService, telegram: TelegramService, whatsapp: WhatsappService);
    sendOrderDelivered(order: any, content: string): Promise<void>;
    sendOutOfStock(order: any): Promise<void>;
    sendPaymentConfirmed(order: any): Promise<void>;
    private logNotification;
}
