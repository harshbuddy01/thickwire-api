"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const throttler_1 = require("@nestjs/throttler");
const prisma_module_1 = require("./prisma/prisma.module");
const redis_module_1 = require("./redis/redis.module");
const auth_module_1 = require("./auth/auth.module");
const customer_auth_module_1 = require("./customer-auth/customer-auth.module");
const email_module_1 = require("./email/email.module");
const telegram_module_1 = require("./telegram/telegram.module");
const notification_module_1 = require("./notification/notification.module");
const whatsapp_module_1 = require("./whatsapp/whatsapp.module");
const services_module_1 = require("./services/services.module");
const inventory_module_1 = require("./inventory/inventory.module");
const orders_module_1 = require("./orders/orders.module");
const automation_module_1 = require("./automation/automation.module");
const account_module_1 = require("./account/account.module");
const coupons_module_1 = require("./coupons/coupons.module");
const support_module_1 = require("./support/support.module");
const admin_module_1 = require("./admin/admin.module");
const cron_module_1 = require("./cron/cron.module");
const health_controller_1 = require("./health/health.controller");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            schedule_1.ScheduleModule.forRoot(),
            throttler_1.ThrottlerModule.forRoot([
                { name: 'short', ttl: 1000, limit: 20 },
                { name: 'long', ttl: 60000, limit: 100 },
            ]),
            prisma_module_1.PrismaModule,
            redis_module_1.RedisModule,
            auth_module_1.AuthModule,
            customer_auth_module_1.CustomerAuthModule,
            email_module_1.EmailModule,
            telegram_module_1.TelegramModule,
            notification_module_1.NotificationModule,
            whatsapp_module_1.WhatsappModule,
            services_module_1.ServicesModule,
            inventory_module_1.InventoryModule,
            orders_module_1.OrdersModule,
            automation_module_1.AutomationModule,
            account_module_1.AccountModule,
            coupons_module_1.CouponsModule,
            support_module_1.SupportModule,
            admin_module_1.AdminModule,
            cron_module_1.CronModule,
        ],
        controllers: [health_controller_1.HealthController],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map