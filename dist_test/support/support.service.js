"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
let SupportService = class SupportService {
    constructor(prisma, emailService) {
        this.prisma = prisma;
        this.emailService = emailService;
    }
    async getAllTickets() {
        return this.prisma.supportTicket.findMany({
            orderBy: { createdAt: 'desc' },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        });
    }
    async getTicketById(id) {
        const ticket = await this.prisma.supportTicket.findUnique({
            where: { id },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        });
        if (!ticket)
            throw new common_1.NotFoundException('Ticket not found');
        return ticket;
    }
    async getMyTickets(email) {
        return this.prisma.supportTicket.findMany({
            where: { customerEmail: email },
            orderBy: { createdAt: 'desc' },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        });
    }
    async createTicket(data) {
        const ticket = await this.prisma.supportTicket.create({
            data: {
                customerName: data.customerName,
                customerEmail: data.customerEmail,
                subject: data.subject,
                message: data.message,
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
        this.emailService.sendSupportAutoReply(ticket.customerEmail, {
            customerName: ticket.customerName,
            ticketId: ticket.id,
            subject: ticket.subject
        }).catch(error => {
            console.error(`Failed to send support auto-reply to ${ticket.customerEmail}:`, error);
        });
        return ticket;
    }
    async replyToTicket(id, replyText) {
        const ticket = await this.getTicketById(id);
        await this.prisma.ticketMessage.create({
            data: {
                ticketId: id,
                sender: 'ADMIN',
                text: replyText
            }
        });
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
    async customerReply(id, replyText) {
        const ticket = await this.getTicketById(id);
        await this.prisma.ticketMessage.create({
            data: {
                ticketId: id,
                sender: 'CUSTOMER',
                text: replyText
            }
        });
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
    async submitRating(id, rating) {
        if (rating < 1 || rating > 5)
            throw new common_1.BadRequestException('Rating must be 1-5');
        const ticket = await this.getTicketById(id);
        if (ticket.status !== 'RESOLVED')
            throw new common_1.BadRequestException('Can only rate resolved tickets');
        return this.prisma.supportTicket.update({
            where: { id },
            data: { rating },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        });
    }
    async resolveTicket(id) {
        return this.prisma.supportTicket.update({
            where: { id },
            data: { status: 'RESOLVED', updatedAt: new Date() },
            include: { messages: { orderBy: { createdAt: 'asc' } } }
        });
    }
};
exports.SupportService = SupportService;
exports.SupportService = SupportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        email_service_1.EmailService])
], SupportService);
//# sourceMappingURL=support.service.js.map