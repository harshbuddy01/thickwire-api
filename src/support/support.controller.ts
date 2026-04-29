import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SupportService } from './support.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('support')
export class SupportController {
    constructor(private readonly supportService: SupportService) { }

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
    async customerReplyToTicket(@Param('id') id: string, @Body() body: { replyText: string }) {
        return this.supportService.customerReply(id, body.replyText);
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
