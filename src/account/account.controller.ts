import { Controller, Get, Patch, Param, Body, Req, UseGuards } from '@nestjs/common';
import { AccountService } from './account.service';
import { CustomerJwtGuard } from '../customer-auth/customer-jwt.guard';

@Controller('account')
@UseGuards(CustomerJwtGuard)
export class AccountController {
    constructor(private readonly accountService: AccountService) { }

    @Get('orders')
    async getOrders(@Req() req: any) {
        return this.accountService.getOrders(req.user.id);
    }

    @Get('orders/:id')
    async getOrderDetail(@Req() req: any, @Param('id') id: string) {
        return this.accountService.getOrderDetail(req.user.id, id);
    }

    @Get('orders/:id/credential')
    async getOrderCredential(@Req() req: any, @Param('id') id: string) {
        return this.accountService.getOrderCredential(req.user.id, id);
    }

    @Get('subscriptions')
    async getSubscriptions(@Req() req: any) {
        return this.accountService.getSubscriptions(req.user.id);
    }

    @Patch('preferences')
    async updatePreferences(@Req() req: any, @Body() body: { whatsappOptedIn?: boolean; phone?: string }) {
        return this.accountService.updatePreferences(req.user.id, body);
    }
}
