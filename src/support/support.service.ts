import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class SupportService {
    constructor(
        private prisma: PrismaService,
        private emailService: EmailService
    ) { }

    async getAllTickets() {
        return this.prisma.supportTicket.findMany({
            orderBy: { createdAt: 'desc' }
        });
    }

    async getTicketById(id: string) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id }
        });
        if (!ticket) throw new NotFoundException('Ticket not found');
        return ticket;
    }

    async createTicket(data: { customerName: string; customerEmail: string; subject: string; message: string; orderId?: string }) {
        const ticket = await this.prisma.supportTicket.create({
            data: {
                ...data,
                status: 'OPEN'
            }
        });
        
        try {
            await this.emailService.sendSupportAutoReply(ticket.customerEmail, {
                customerName: ticket.customerName,
                ticketId: ticket.id,
                subject: ticket.subject
            });
        } catch (error) {
            console.error(`Failed to send support auto-reply to ${ticket.customerEmail}:`, error);
        }
        
        return ticket;
    }

    async replyToTicket(id: string, replyText: string) {
        const ticket = await this.getTicketById(id);

        await this.emailService.sendSupportReply(ticket.customerEmail, {
            customerName: ticket.customerName,
            ticketId: ticket.id,
            subject: ticket.subject,
            replyText
        });

        return this.prisma.supportTicket.update({
            where: { id },
            data: { status: 'RESOLVED', updatedAt: new Date() }
        });
    }
}
