import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
            orderBy: { createdAt: 'desc' },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        });
    }

    async getTicketById(id: string) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        });
        if (!ticket) throw new NotFoundException('Ticket not found');
        return ticket;
    }

    async getMyTickets(email: string) {
        return this.prisma.supportTicket.findMany({
            where: { customerEmail: email },
            orderBy: { createdAt: 'desc' },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        });
    }

    async createTicket(data: { customerName: string; customerEmail: string; subject: string; message: string; orderId?: string }) {
        const ticket = await this.prisma.supportTicket.create({
            data: {
                customerName: data.customerName,
                customerEmail: data.customerEmail,
                subject: data.subject,
                message: data.message, // Add this back
                orderId: data.orderId,
                status: 'OPEN',
                messages: {
                    create: {
                        sender: 'CUSTOMER',
                        text: data.message
                    }
                }
            },
            include: { messages: true }
        });
        
        // Fire-and-forget email to avoid blocking the HTTP response if SMTP is slow
        this.emailService.sendSupportAutoReply(ticket.customerEmail, {
            customerName: ticket.customerName,
            ticketId: ticket.id,
            subject: ticket.subject
        }).catch(error => {
            console.error(`Failed to send support auto-reply to ${ticket.customerEmail}:`, error);
        });
        
        return ticket;
    }

    async replyToTicket(id: string, replyText: string) {
        const ticket = await this.getTicketById(id);

        await this.prisma.ticketMessage.create({
            data: {
                ticketId: id,
                sender: 'ADMIN',
                text: replyText
            }
        });

        // Fire-and-forget email
        this.emailService.sendSupportReply(ticket.customerEmail, {
            customerName: ticket.customerName,
            ticketId: ticket.id,
            subject: ticket.subject,
            replyText
        }).catch(error => {
            console.error(`Failed to send support reply to ${ticket.customerEmail}:`, error);
        });

        return this.getTicketById(id);
    }
    
    async customerReply(id: string, replyText: string) {
        const ticket = await this.getTicketById(id);

        await this.prisma.ticketMessage.create({
            data: {
                ticketId: id,
                sender: 'CUSTOMER',
                text: replyText
            }
        });

        // Notify admin of customer reply (fire-and-forget)
        this.emailService.sendAdminNotification({
            subject: `[Reply] Ticket #${id.substring(0, 8)}: ${ticket.subject}`,
            body: `Customer ${ticket.customerName} (${ticket.customerEmail}) replied:\n\n${replyText}`,
        }).catch(err => console.error('Admin notify on customer reply failed:', err));

        return this.prisma.supportTicket.update({
            where: { id },
            data: { status: 'OPEN', updatedAt: new Date() },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        });
    }

    async submitRating(id: string, rating: number) {
        if (rating < 1 || rating > 5) throw new BadRequestException('Rating must be 1-5');
        const ticket = await this.getTicketById(id);
        if (ticket.status !== 'RESOLVED') throw new BadRequestException('Can only rate resolved tickets');
        return this.prisma.supportTicket.update({
            where: { id },
            data: { rating },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        });
    }
    
    async resolveTicket(id: string) {
        return this.prisma.supportTicket.update({
            where: { id },
            data: { status: 'RESOLVED', updatedAt: new Date() },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        });
    }
}
