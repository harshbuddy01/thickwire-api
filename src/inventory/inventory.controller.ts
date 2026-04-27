import {
    Controller, Get, Post, Body, Param, Query, UseGuards, Req,
} from '@nestjs/common';
import { Request } from 'express';
import { InventoryService } from './inventory.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
    constructor(private readonly inventoryService: InventoryService) { }

    @Post('single')
    @Roles('SUPER_ADMIN', 'MANAGER')
    async addSingle(
        @Body() body: { planId: string; content: string },
        @Req() req: Request,
    ) {
        return this.inventoryService.addSingle(
            body.planId,
            body.content,
            (req.user as any).id,
        );
    }

    @Post('bulk')
    @Roles('SUPER_ADMIN', 'MANAGER')
    async addBulk(
        @Body() body: { planId: string; contents: string[] },
        @Req() req: Request,
    ) {
        return this.inventoryService.addBulk(
            body.planId,
            body.contents,
            (req.user as any).id,
        );
    }

    @Get('plan/:planId')
    @Roles('SUPER_ADMIN', 'MANAGER', 'SUPPORT')
    async findByPlan(
        @Param('planId') planId: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return this.inventoryService.findByPlan(planId, page, limit);
    }

    @Get('stock-counts')
    @Roles('SUPER_ADMIN', 'MANAGER')
    async getStockCounts() {
        return this.inventoryService.getStockCounts();
    }
}
