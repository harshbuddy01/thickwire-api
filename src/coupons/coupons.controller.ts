import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('coupons')
export class CouponsController {
    constructor(private readonly couponsService: CouponsService) { }

    // ── Public Route ───────────────────────────────────
    @Post('validate')
    async validateCoupon(@Body() body: { code: string; planId: string; amount: number; customerId?: string }) {
        return this.couponsService.validateCoupon(body.code, body.planId, body.amount, body.customerId);
    }

    // ── Admin Routes (JWT + Role-Protected) ────────────
    @Get('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER')
    async findAll() {
        return this.couponsService.findAll();
    }

    @Get('admin/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER')
    async findOne(@Param('id') id: string) {
        return this.couponsService.findOne(id);
    }

    @Post('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER')
    async create(@Body() body: any) {
        return this.couponsService.create(body);
    }

    @Patch('admin/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER')
    async update(@Param('id') id: string, @Body() body: any) {
        return this.couponsService.update(id, body);
    }

    @Delete('admin/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER')
    async deactivate(@Param('id') id: string) {
        return this.couponsService.delete(id);
    }

    @Get('admin/:id/usage')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER')
    async getUsage(@Param('id') id: string) {
        return this.couponsService.getUsage(id);
    }

    @Post('admin/bulk-generate')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN')
    async bulkGenerate(@Body() body: { count: number; prefix: string; discountType: 'PERCENT' | 'FLAT'; discountValue: number; maxUses?: number; expiresAt?: string }) {
        return this.couponsService.bulkGenerate(body.count, body.prefix, body);
    }
}
