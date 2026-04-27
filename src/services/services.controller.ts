import {
    Controller, Get, Post, Put, Delete, Param, Body, UseGuards, NotFoundException,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('services')
export class ServicesController {
    constructor(private readonly servicesService: ServicesService) { }

    // ─── Public ───────────────────────────────────────────

    @Get()
    async findAll() {
        return this.servicesService.findAllActive();
    }

    @Get(':slug')
    async findBySlug(@Param('slug') slug: string) {
        const service = await this.servicesService.findBySlug(slug);
        if (!service) throw new NotFoundException('Service not found');
        return service;
    }

    // ─── Admin: Services ──────────────────────────────────

    @Get('admin/list')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER')
    async adminFindAll() {
        return this.servicesService.findAll();
    }

    @Post('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER')
    async create(@Body() body: { name: string; slug: string; logoUrl?: string; description?: string; displayOrder?: number }) {
        return this.servicesService.create(body);
    }

    @Put('admin/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER')
    async update(@Param('id') id: string, @Body() body: any) {
        return this.servicesService.update(id, body);
    }

    @Delete('admin/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER')
    async softDelete(@Param('id') id: string) {
        await this.servicesService.softDelete(id);
        return { message: 'Service deleted' };
    }

    // ─── Admin: Plans ─────────────────────────────────────

    @Get('admin/:serviceId/plans')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER')
    async findPlans(@Param('serviceId') serviceId: string) {
        return this.servicesService.findPlans(serviceId);
    }

    @Post('admin/:serviceId/plans')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER')
    async createPlan(
        @Param('serviceId') serviceId: string,
        @Body() body: { name: string; slug: string; description?: string; price: number; originalPrice?: number; durationDays: number; displayOrder?: number },
    ) {
        return this.servicesService.createPlan({ ...body, serviceId });
    }

    @Put('admin/plans/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER')
    async updatePlan(@Param('id') id: string, @Body() body: any) {
        return this.servicesService.updatePlan(id, body);
    }

    @Delete('admin/plans/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER')
    async softDeletePlan(@Param('id') id: string) {
        await this.servicesService.softDeletePlan(id);
        return { message: 'Plan deleted' };
    }
}
