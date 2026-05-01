import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
export declare class SupportService {
    private prisma;
    private emailService;
    constructor(prisma: PrismaService, emailService: EmailService);
    getAllTickets(): Promise<({
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
    getTicketById(id: string): Promise<{
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
    getMyTickets(email: string): Promise<({
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
    createTicket(data: {
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
    replyToTicket(id: string, replyText: string): Promise<{
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
    customerReply(id: string, replyText: string): Promise<{
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
    submitRating(id: string, rating: number): Promise<{
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
