import {
    Controller, Get, Post, Delete, Body, Param, Query, Req, UseGuards,
    HttpCode, HttpStatus, Headers, RawBodyRequest,
} from '@nestjs/common';
import { Request } from 'express';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { OptionalCustomerJwtGuard } from '../customer-auth/optional-customer-jwt.guard';

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    // ─── Public ───────────────────────────────────────────

    @Post('create')
    @UseGuards(OptionalCustomerJwtGuard)
    async createOrder(
        @Body() body: {
            customerName: string;
            customerEmail: string;
            customerPhone: string;
            planId: string;
            couponCode?: string;
            gateway?: 'razorpay' | 'cashfree';
            whatsappOptedIn?: boolean;
            serviceCredentials?: Record<string, any>;
        },
        @Req() req: any,
    ) {
        const customerId = req.user?.id || null;
        return this.ordersService.createOrder({ ...body, customerId });
    }

    @Post('verify-payment')
    async verifyPayment(
        @Body() body: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
        },
    ) {
        return this.ordersService.verifyPayment(body);
    }

    @Post('webhook')
    @HttpCode(HttpStatus.OK)
    async webhook(
        @Req() req: RawBodyRequest<Request>,
        @Headers('x-razorpay-signature') signature: string,
    ) {
        return this.ordersService.handleWebhook(req.rawBody!, signature);
    }

    @Post('webhook/cashfree')
    @HttpCode(HttpStatus.OK)
    async webhookCashfree(
        @Req() req: RawBodyRequest<Request>,
        @Headers('x-webhook-signature') signature: string,
    ) {
        // signature comes in headers for Cashfree usually. Note: Cashfree's specific header is `x-webhook-signature`
        return this.ordersService.handleCashfreeWebhook(req.rawBody!.toString('utf8'), signature);
    }

    @Get('status/:id')
    async getStatus(@Param('id') id: string) {
        return this.ordersService.getOrderStatus(id);
    }

    // ─── Admin ────────────────────────────────────────────

    @Get('admin/list')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER', 'SUPPORT')
    async findAll(
        @Query('paymentStatus') paymentStatus?: string,
        @Query('fulfillmentStatus') fulfillmentStatus?: string,
        @Query('search') search?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.ordersService.findAll({ paymentStatus, fulfillmentStatus, search, page, limit });
    }

    @Get('admin/credentials')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER', 'SUPPORT')
    async getServiceCredentials(
        @Query('service') service?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.ordersService.getServiceCredentialOrders({ service, page, limit });
    }

    @Post('admin/:id/fulfill')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER')
    async manualFulfill(
        @Param('id') id: string,
        @Body('content') content: string,
    ) {
        return this.ordersService.manualFulfill(id, content);
    }

    @Post('admin/:id/send-link')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER')
    async sendActivationLink(
        @Param('id') id: string,
        @Body('link') link: string,
    ) {
        return this.ordersService.sendActivationLink(id, link);
    }

    @Delete('admin/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    async deleteOrder(@Param('id') id: string) {
        await this.ordersService.deleteOrder(id);
        return { message: 'Order deleted successfully' };
    }
}
