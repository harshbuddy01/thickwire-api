import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

// Core infrastructure
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';

// Auth
import { AuthModule } from './auth/auth.module';
import { CustomerAuthModule } from './customer-auth/customer-auth.module';
// Communication (global modules)
import { EmailModule } from './email/email.module';
import { TelegramModule } from './telegram/telegram.module';
import { NotificationModule } from './notification/notification.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';

// Feature modules
import { ServicesModule } from './services/services.module';
import { InventoryModule } from './inventory/inventory.module';
import { OrdersModule } from './orders/orders.module';
import { AutomationModule } from './automation/automation.module';
import { AccountModule } from './account/account.module';
import { CouponsModule } from './coupons/coupons.module';

// Admin & support
import { SupportModule } from './support/support.module';
import { AdminModule } from './admin/admin.module';
import { CronModule } from './cron/cron.module';

// Health
import { HealthController } from './health/health.controller';

@Module({
    imports: [
        // Config
        ConfigModule.forRoot({ isGlobal: true }),
        ScheduleModule.forRoot(),
        ThrottlerModule.forRoot([
            { name: 'short', ttl: 1000, limit: 20 },
            { name: 'long', ttl: 60000, limit: 100 },
        ]),

        // Infrastructure
        PrismaModule,
        RedisModule,

        // Auth
        AuthModule,
        CustomerAuthModule,

        // Communication (global)
        EmailModule,
        TelegramModule,
        NotificationModule,
        WhatsappModule,

        // Features
        ServicesModule,
        InventoryModule,
        OrdersModule,
        AutomationModule,
        AccountModule,
        CouponsModule,

        // Admin & support
        SupportModule,
        AdminModule,
        CronModule,
    ],
    controllers: [HealthController],
})
export class AppModule { }
