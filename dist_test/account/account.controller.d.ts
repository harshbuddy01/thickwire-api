import { AccountService } from './account.service';
export declare class AccountController {
    private readonly accountService;
    constructor(accountService: AccountService);
    getOrders(req: any): Promise<({
        service: {
            name: string;
            slug: string;
            logoUrl: string | null;
        };
        plan: {
            name: string;
            slug: string;
            durationDays: number;
        };
        subscriptionExpiry: {
            expiresAt: Date;
            activatedAt: Date;
            status: import(".prisma/client").$Enums.ExpiryStatus;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        whatsappOptedIn: boolean;
        updatedAt: Date;
        customerId: string | null;
        customerEmail: string;
        customerName: string;
        customerPhone: string;
        amountPaid: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        paymentGateway: string;
        paymentReference: string | null;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        fulfillmentStatus: import(".prisma/client").$Enums.FulfillmentStatus;
        inventoryId: string | null;
        deliveredAt: Date | null;
        discountAmount: import("@prisma/client/runtime/library").Decimal | null;
        finalAmount: import("@prisma/client/runtime/library").Decimal | null;
        serviceId: string;
        planId: string;
        couponId: string | null;
    })[]>;
    getOrderDetail(req: any, id: string): Promise<({
        service: {
            name: string;
            slug: string;
            logoUrl: string | null;
        };
        plan: {
            name: string;
            slug: string;
            price: import("@prisma/client/runtime/library").Decimal;
            durationDays: number;
        };
        subscriptionExpiry: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            customerId: string | null;
            expiresAt: Date;
            customerEmail: string;
            serviceId: string;
            planId: string;
            serviceName: string;
            planName: string;
            activatedAt: Date;
            status: import(".prisma/client").$Enums.ExpiryStatus;
            reminder7Sent: boolean;
            reminder3Sent: boolean;
            reminder1Sent: boolean;
            expiredAlertSent: boolean;
            orderId: string;
        } | null;
    } & {
        id: string;
        createdAt: Date;
        whatsappOptedIn: boolean;
        updatedAt: Date;
        customerId: string | null;
        customerEmail: string;
        customerName: string;
        customerPhone: string;
        amountPaid: import("@prisma/client/runtime/library").Decimal;
        currency: string;
        paymentGateway: string;
        paymentReference: string | null;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        fulfillmentStatus: import(".prisma/client").$Enums.FulfillmentStatus;
        inventoryId: string | null;
        deliveredAt: Date | null;
        discountAmount: import("@prisma/client/runtime/library").Decimal | null;
        finalAmount: import("@prisma/client/runtime/library").Decimal | null;
        serviceId: string;
        planId: string;
        couponId: string | null;
    }) | null>;
    getOrderCredential(req: any, id: string): Promise<{
        credential: string;
        activatedAt: Date | null;
        expiresAt: Date | null;
        status: import(".prisma/client").$Enums.ExpiryStatus | null;
    }>;
    getSubscriptions(req: any): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        customerId: string | null;
        expiresAt: Date;
        customerEmail: string;
        serviceId: string;
        planId: string;
        serviceName: string;
        planName: string;
        activatedAt: Date;
        status: import(".prisma/client").$Enums.ExpiryStatus;
        reminder7Sent: boolean;
        reminder3Sent: boolean;
        reminder1Sent: boolean;
        expiredAlertSent: boolean;
        orderId: string;
    }[]>;
    updatePreferences(req: any, body: {
        whatsappOptedIn?: boolean;
        phone?: string;
    }): Promise<{
        id: string;
        phone: string | null;
        whatsappOptedIn: boolean;
    }>;
}
