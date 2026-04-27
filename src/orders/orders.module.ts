import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { AutomationModule } from '../automation/automation.module';
import { NotificationModule } from '../notification/notification.module';
import { CouponsModule } from '../coupons/coupons.module';
import { CashfreeAdapter } from '../payments/cashfree.adapter';

@Module({
    imports: [AutomationModule, NotificationModule, CouponsModule],
    controllers: [OrdersController],
    providers: [OrdersService, CashfreeAdapter],
    exports: [OrdersService],
})
export class OrdersModule { }
