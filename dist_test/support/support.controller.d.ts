import { Request } from 'express';
import { SupportService } from './support.service';
export declare class SupportController {
    private readonly supportService;
    constructor(supportService: SupportService);
    getMyTickets(req: Request): Promise<({
        messages: {
            id: string;
            createdAt: Date;
            sender: string;
            text: string;
            ticketId: string;
        }[];
    } & {
        message: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerEmail: string;
        customerName: string;
        status: import(".prisma/client").$Enums.TicketStatus;
        orderId: string | null;
        subject: string;
        autoReplySent: boolean;
        rating: number | null;
    })[]>;
    createTicket(body: {
        customerName: string;
        customerEmail: string;
        subject: string;
        message: string;
        orderId?: string;
    }): Promise<{
        messages: {
            id: string;
            createdAt: Date;
            sender: string;
            text: string;
            ticketId: string;
        }[];
    } & {
        message: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerEmail: string;
        customerName: string;
        status: import(".prisma/client").$Enums.TicketStatus;
        orderId: string | null;
        subject: string;
        autoReplySent: boolean;
        rating: number | null;
    }>;
    getTickets(): Promise<({
        messages: {
            id: string;
            createdAt: Date;
            sender: string;
            text: string;
            ticketId: string;
        }[];
    } & {
        message: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerEmail: string;
        customerName: string;
        status: import(".prisma/client").$Enums.TicketStatus;
        orderId: string | null;
        subject: string;
        autoReplySent: boolean;
        rating: number | null;
    })[]>;
    getTicket(id: string): Promise<{
        messages: {
            id: string;
            createdAt: Date;
            sender: string;
            text: string;
            ticketId: string;
        }[];
    } & {
        message: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerEmail: string;
        customerName: string;
        status: import(".prisma/client").$Enums.TicketStatus;
        orderId: string | null;
        subject: string;
        autoReplySent: boolean;
        rating: number | null;
    }>;
    customerReplyToTicket(id: string, body: {
        replyText: string;
    }): Promise<{
        messages: {
            id: string;
            createdAt: Date;
            sender: string;
            text: string;
            ticketId: string;
        }[];
    } & {
        message: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerEmail: string;
        customerName: string;
        status: import(".prisma/client").$Enums.TicketStatus;
        orderId: string | null;
        subject: string;
        autoReplySent: boolean;
        rating: number | null;
    }>;
    submitRating(id: string, body: {
        rating: number;
    }): Promise<{
        messages: {
            id: string;
            createdAt: Date;
            sender: string;
            text: string;
            ticketId: string;
        }[];
    } & {
        message: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerEmail: string;
        customerName: string;
        status: import(".prisma/client").$Enums.TicketStatus;
        orderId: string | null;
        subject: string;
        autoReplySent: boolean;
        rating: number | null;
    }>;
    adminReplyToTicket(id: string, body: {
        replyText: string;
    }): Promise<{
        messages: {
            id: string;
            createdAt: Date;
            sender: string;
            text: string;
            ticketId: string;
        }[];
    } & {
        message: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerEmail: string;
        customerName: string;
        status: import(".prisma/client").$Enums.TicketStatus;
        orderId: string | null;
        subject: string;
        autoReplySent: boolean;
        rating: number | null;
    }>;
    resolveTicket(id: string): Promise<{
        messages: {
            id: string;
            createdAt: Date;
            sender: string;
            text: string;
            ticketId: string;
        }[];
    } & {
        message: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerEmail: string;
        customerName: string;
        status: import(".prisma/client").$Enums.TicketStatus;
        orderId: string | null;
        subject: string;
        autoReplySent: boolean;
        rating: number | null;
    }>;
}
