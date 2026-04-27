import {
    Controller, Get, Post, Put, Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { TelegramService } from '../telegram/telegram.service';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
    constructor(
        private readonly adminService: AdminService,
        private readonly telegram: TelegramService,
    ) { }

    // ─── Dashboard ────────────────────────────────────────
    @Get('dashboard')
    @Roles('SUPER_ADMIN', 'MANAGER')
    async dashboard() {
        return this.adminService.getDashboardStats();
    }

    // ─── Admin Users ──────────────────────────────────────
    @Get('users')
    @Roles('SUPER_ADMIN')
    async listAdmins() {
        return this.adminService.findAllAdmins();
    }

    @Post('users')
    @Roles('SUPER_ADMIN')
    async createAdmin(
        @Body() body: { name: string; email: string; password: string; role?: string },
    ) {
        return this.adminService.createAdmin(body);
    }

    @Put('users/:id')
    @Roles('SUPER_ADMIN')
    async updateAdmin(@Param('id') id: string, @Body() body: any) {
        return this.adminService.updateAdmin(id, body);
    }

    // ─── Audit Logs ───────────────────────────────────────
    @Get('audit-logs')
    @Roles('SUPER_ADMIN')
    async auditLogs(@Query('page') page?: number, @Query('limit') limit?: number) {
        return this.adminService.getAuditLogs(page, limit);
    }

    // ─── Settings ─────────────────────────────────────────
    @Post('settings/test-telegram')
    @Roles('SUPER_ADMIN', 'MANAGER')
    async testTelegram() {
        const ok = await this.telegram.testConnection();
        return { success: ok };
    }

    // ─── Customers ────────────────────────────────────────
    @Get('customers')
    @Roles('SUPER_ADMIN', 'MANAGER')
    async listCustomers(
        @Query('search') search?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.adminService.findAllCustomers({ search, page, limit });
    }

    @Get('customers/:id')
    @Roles('SUPER_ADMIN', 'MANAGER')
    async getCustomer(@Param('id') id: string) {
        return this.adminService.getCustomerDetail(id);
    }

    @Put('customers/:id/toggle-active')
    @Roles('SUPER_ADMIN')
    async toggleCustomer(
        @Param('id') id: string,
        @Body('isActive') isActive: boolean,
    ) {
        return this.adminService.toggleCustomerActive(id, isActive);
    }

    // ─── Subscriptions ────────────────────────────────────
    @Get('subscriptions')
    @Roles('SUPER_ADMIN', 'MANAGER')
    async listSubscriptions(
        @Query('status') status?: string,
        @Query('search') search?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.adminService.findAllSubscriptions({ status, search, page, limit });
    }

    // ─── Reports ──────────────────────────────────────────
    @Get('reports/revenue-by-service')
    @Roles('SUPER_ADMIN', 'MANAGER')
    async revenueByService() {
        return this.adminService.getRevenueByService();
    }

    @Get('reports/revenue-by-plan')
    @Roles('SUPER_ADMIN', 'MANAGER')
    async revenueByPlan() {
        return this.adminService.getRevenueByPlan();
    }

    @Get('reports/coupon-performance')
    @Roles('SUPER_ADMIN', 'MANAGER')
    async couponPerformance() {
        return this.adminService.getCouponPerformance();
    }

    @Get('reports/orders-export')
    @Roles('SUPER_ADMIN')
    async ordersExport() {
        return this.adminService.getOrdersExport('json');
    }
}
