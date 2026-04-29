import { Controller, Get, Post, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CustomerJwtGuard } from '../customer-auth/customer-jwt.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('support')
export class SupportController {
    constructor(private readonly supportService: SupportService) { }

    @Get('my-tickets')
    @UseGuards(CustomerJwtGuard)
    async getMyTickets(@Req() req: Request) {
        return this.supportService.getMyTickets((req.user as any).email);
    }

    @Post()
    async createTicket(@Body() body: { customerName: string; customerEmail: string; subject: string; message: string; orderId?: string }) {
        return this.supportService.createTicket(body);
    }

    @Get('admin')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER', 'SUPPORT')
    async getTickets() {
        return this.supportService.getAllTickets();
    }

    @Get('admin/:id')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER', 'SUPPORT')
    async getTicket(@Param('id') id: string) {
        return this.supportService.getTicketById(id);
    }

    @Post(':id/reply')
    @UseGuards(CustomerJwtGuard)
    async customerReplyToTicket(@Param('id') id: string, @Body() body: { replyText: string }) {
        return this.supportService.customerReply(id, body.replyText);
    }

    @Patch(':id/rating')
    @UseGuards(CustomerJwtGuard)
    async submitRating(@Param('id') id: string, @Body() body: { rating: number }) {
        return this.supportService.submitRating(id, body.rating);
    }

    @Post('admin/:id/reply')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER', 'SUPPORT')
    async adminReplyToTicket(@Param('id') id: string, @Body() body: { replyText: string }) {
        return this.supportService.replyToTicket(id, body.replyText);
    }
    
    @Post('admin/:id/resolve')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('SUPER_ADMIN', 'MANAGER', 'SUPPORT')
    async resolveTicket(@Param('id') id: string) {
        return this.supportService.resolveTicket(id);
    }
}
