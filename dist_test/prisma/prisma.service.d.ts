import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService implements OnModuleInit, OnModuleDestroy {
    private _client;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    get service(): import(".prisma/client").Prisma.ServiceDelegate<import("@prisma/client/runtime/library").DefaultArgs>;
    get plan(): import(".prisma/client").Prisma.PlanDelegate<import("@prisma/client/runtime/library").DefaultArgs>;
    get inventory(): import(".prisma/client").Prisma.InventoryDelegate<import("@prisma/client/runtime/library").DefaultArgs>;
    get order(): import(".prisma/client").Prisma.OrderDelegate<import("@prisma/client/runtime/library").DefaultArgs>;
    get admin(): import(".prisma/client").Prisma.AdminDelegate<import("@prisma/client/runtime/library").DefaultArgs>;
    get auditLog(): import(".prisma/client").Prisma.AuditLogDelegate<import("@prisma/client/runtime/library").DefaultArgs>;
    get supportTicket(): import(".prisma/client").Prisma.SupportTicketDelegate<import("@prisma/client/runtime/library").DefaultArgs>;
    get ticketMessage(): import(".prisma/client").Prisma.TicketMessageDelegate<import("@prisma/client/runtime/library").DefaultArgs>;
    get notificationLog(): import(".prisma/client").Prisma.NotificationLogDelegate<import("@prisma/client/runtime/library").DefaultArgs>;
    get coupon(): import(".prisma/client").Prisma.CouponDelegate<import("@prisma/client/runtime/library").DefaultArgs>;
    get customerAccount(): import(".prisma/client").Prisma.CustomerAccountDelegate<import("@prisma/client/runtime/library").DefaultArgs>;
    get customerSession(): import(".prisma/client").Prisma.CustomerSessionDelegate<import("@prisma/client/runtime/library").DefaultArgs>;
    get subscriptionExpiry(): import(".prisma/client").Prisma.SubscriptionExpiryDelegate<import("@prisma/client/runtime/library").DefaultArgs>;
    get couponUsage(): import(".prisma/client").Prisma.CouponUsageDelegate<import("@prisma/client/runtime/library").DefaultArgs>;
    $queryRaw<T = unknown>(...args: Parameters<PrismaClient['$queryRaw']>): ReturnType<PrismaClient['$queryRaw']>;
    $transaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T>;
}
