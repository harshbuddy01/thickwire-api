import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';
export declare class AdminService {
    private readonly prisma;
    private readonly encryption;
    private readonly logger;
    constructor(prisma: PrismaService, encryption: EncryptionService);
    getDashboardStats(): Promise<{
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
    findAllCustomers(filters?: {
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
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
    getCustomerDetail(id: string): Promise<{
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
    toggleCustomerActive(id: string, isActive: boolean): Promise<{
        id: string;
        email: string;
        isActive: boolean;
    }>;
    findAllSubscriptions(filters?: {
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
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
    getDeliveredCredentials(filters?: {
        page?: number;
        limit?: number;
    }): Promise<{
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
    getOrderCredentialForAdmin(orderId: string): Promise<{
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
    getRevenueByService(): Promise<{
        serviceName: any;
        totalRevenue: number;
        orderCount: number;
    }[]>;
    getRevenueByPlan(): Promise<{
        planName: any;
        serviceName: any;
        totalRevenue: number;
        orderCount: number;
    }[]>;
    getCouponPerformance(): Promise<{
        id: string;
        isActive: boolean;
        code: string;
        expiresAt: Date | null;
        discountType: import(".prisma/client").$Enums.DiscountType;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        maxUses: number | null;
        usedCount: number;
    }[]>;
    getOrdersExport(format: 'json'): Promise<({
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
    findAllAdmins(): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.AdminRole;
        totpEnabled: boolean;
        isActive: boolean;
        lastLoginAt: Date | null;
        createdAt: Date;
    }[]>;
    createAdmin(data: {
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
    updateAdmin(id: string, data: Partial<{
        name: string;
        email: string;
        role: string;
        isActive: boolean;
    }>): Promise<{
        id: string;
        email: string;
        name: string;
        role: import(".prisma/client").$Enums.AdminRole;
        isActive: boolean;
    }>;
    getAuditLogs(page?: number, limit?: number): Promise<{
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
    createAuditLog(data: {
        adminId: string;
        action: string;
        entityType: string;
        entityId: string;
        oldValue?: any;
        newValue?: any;
        ipAddress?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        adminId: string;
        action: string;
        entityType: string;
        entityId: string;
        oldValue: import("@prisma/client/runtime/library").JsonValue | null;
        newValue: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
    }>;
}
