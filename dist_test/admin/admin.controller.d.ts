import { AdminService } from './admin.service';
import { TelegramService } from '../telegram/telegram.service';
export declare class AdminController {
    private readonly adminService;
    private readonly telegram;
    constructor(adminService: AdminService, telegram: TelegramService);
    dashboard(): Promise<{
        kpis: {
            totalOrders: number;
            confirmedOrders: number;
            totalRevenue: number | import("@prisma/client/runtime/library").Decimal;
            pendingOrders: number;
            totalServices: number;
            openTickets: number;
            activeCustomers: number;
            expiringThisWeek: number;
        };
        recentOrders: ({
            service: {
                name: string;
            };
            plan: {
                name: string;
            };
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
        })[];
        dailyRevenue: {
            date: string;
            total: number;
        }[];
    }>;
    listAdmins(): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.AdminRole;
        totpEnabled: boolean;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
    }[]>;
    createAdmin(body: {
        name: string;
        email: string;
        password: string;
        role?: string;
    }): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.AdminRole;
        createdAt: Date;
    }>;
    updateAdmin(id: string, body: any): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.AdminRole;
        isActive: boolean;
    }>;
    auditLogs(page?: number, limit?: number): Promise<{
        items: {
            id: string;
            createdAt: Date;
            adminId: string;
            action: string;
            entityType: string;
            entityId: string;
            oldValue: import("@prisma/client/runtime/library").JsonValue | null;
            newValue: import("@prisma/client/runtime/library").JsonValue | null;
            ipAddress: string | null;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    testTelegram(): Promise<{
        success: boolean;
    }>;
    listCustomers(search?: string, page?: number, limit?: number): Promise<{
        items: {
            id: string;
            email: string;
            name: string;
            isActive: boolean;
            lastLoginAt: Date | null;
            createdAt: Date;
            phone: string | null;
            whatsappOptedIn: boolean;
            _count: {
                orders: number;
            };
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getCustomer(id: string): Promise<{
        id: string;
        email: string;
        name: string;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
        phone: string | null;
        whatsappOptedIn: boolean;
        orders: ({
            service: {
                name: string;
            };
            plan: {
                name: string;
            };
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
        })[];
    }>;
    toggleCustomer(id: string, isActive: boolean): Promise<{
        id: string;
        email: string;
        isActive: boolean;
    }>;
    listSubscriptions(status?: string, search?: string, page?: number, limit?: number): Promise<{
        items: ({
            order: {
                service: {
                    name: string;
                };
                plan: {
                    name: string;
                };
                customerName: string;
                customerPhone: string;
            };
        } & {
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
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    listDeliveredCredentials(page?: number, limit?: number): Promise<{
        items: {
            service: {
                name: string;
            };
            plan: {
                name: string;
            };
            subscriptionExpiry: {
                expiresAt: Date;
                activatedAt: Date;
                status: import(".prisma/client").$Enums.ExpiryStatus;
            } | null;
            id: string;
            customerEmail: string;
            customerName: string;
            deliveredAt: Date | null;
        }[];
        total: number;
        page: number;
        limit: number;
    }>;
    getOrderCredential(id: string): Promise<{
        orderId: string;
        customerName: string;
        customerEmail: string;
        serviceName: string;
        planName: string;
        credential: string;
        deliveredAt: Date | null;
        activatedAt: Date | null;
        expiresAt: Date | null;
        status: import(".prisma/client").$Enums.ExpiryStatus | null;
    }>;
    revenueByService(): Promise<{
        serviceName: any;
        totalRevenue: number;
        orderCount: number;
    }[]>;
    revenueByPlan(): Promise<{
        planName: any;
        serviceName: any;
        totalRevenue: number;
        orderCount: number;
    }[]>;
    couponPerformance(): Promise<{
        id: string;
        isActive: boolean;
        code: string;
        expiresAt: Date | null;
        discountType: import(".prisma/client").$Enums.DiscountType;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        maxUses: number | null;
        usedCount: number;
    }[]>;
    ordersExport(): Promise<({
        service: {
            name: string;
        };
        plan: {
            name: string;
        };
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
}
