import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { TelegramService } from '../telegram/telegram.service';
import { ConfigService } from '@nestjs/config';
export declare class CronService {
    private readonly prisma;
    private readonly email;
    private readonly telegram;
    private readonly config;
    private readonly logger;
    private readonly LOW_STOCK_THRESHOLD;
    constructor(prisma: PrismaService, email: EmailService, telegram: TelegramService, config: ConfigService);
    checkLowStock(): Promise<void>;
    checkSubscriptionExpiry(): Promise<void>;
    checkPendingPayments(): Promise<void>;
    checkUnfulfilledOrders(): Promise<void>;
}
