import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
    private readonly logger = new Logger(AdminService.name);

    constructor(private readonly prisma: PrismaService) { }

    // ─── Dashboard Stats ─────────────────────────────────

    async getDashboardStats() {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

        const [
            totalOrders,
            confirmedOrders,
            revenueResult,
            pendingOrders,
            totalServices,
            openTickets,
            recentOrders,
            dailyRevenue,
            activeCustomers,
            expiringThisWeek,
        ] = await Promise.all([
            this.prisma.order.count(),
            this.prisma.order.count({ where: { paymentStatus: 'CONFIRMED' } }),
            this.prisma.order.aggregate({
                where: { paymentStatus: 'CONFIRMED' },
                _sum: { amountPaid: true },
            }),
            this.prisma.order.count({
                where: { fulfillmentStatus: { in: ['PENDING', 'MANUAL_PENDING'] } },
            }),
            this.prisma.service.count({ where: { deletedAt: null } }),
            this.prisma.supportTicket.count({ where: { status: 'OPEN' } }),
            this.prisma.order.findMany({
                orderBy: { createdAt: 'desc' },
                take: 10,
                include: {
                    service: { select: { name: true } },
                    plan: { select: { name: true } },
                },
            }),
            this.prisma.$queryRaw`
        SELECT DATE("createdAt") as date, SUM("amountPaid"::numeric) as total
        FROM "Order"
        WHERE "paymentStatus" = 'CONFIRMED'
          AND "createdAt" >= ${sevenDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      ` as Promise<{ date: string; total: number }[]>,
            this.prisma.customerAccount.count({ where: { isActive: true } }),
            this.prisma.subscriptionExpiry.count({
                where: {
                    status: { in: ['ACTIVE', 'EXPIRING_SOON'] },
                    expiresAt: { lte: nextWeek, gte: now },
                },
            }),
        ]);

        return {
            kpis: {
                totalOrders,
                confirmedOrders,
                totalRevenue: revenueResult._sum.amountPaid || 0,
                pendingOrders,
                totalServices,
                openTickets,
                activeCustomers,
                expiringThisWeek,
            },
            recentOrders,
            dailyRevenue,
        };
    }

    // ─── Customer Management ─────────────────────────────

    async findAllCustomers(filters?: {
        search?: string;
        page?: number;
        limit?: number;
    }) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 25;
        const skip = (page - 1) * limit;
        const where: any = {};

        if (filters?.search) {
            where.OR = [
                { email: { contains: filters.search, mode: 'insensitive' } },
                { name: { contains: filters.search, mode: 'insensitive' } },
                { phone: { contains: filters.search } },
            ];
        }

        const [items, total] = await Promise.all([
            this.prisma.customerAccount.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    isActive: true,
                    whatsappOptedIn: true,
                    lastLoginAt: true,
                    createdAt: true,
                    _count: { select: { orders: true } },
                },
            }),
            this.prisma.customerAccount.count({ where }),
        ]);

        return { items, total, page, limit };
    }

    async getCustomerDetail(id: string) {
        const customer = await this.prisma.customerAccount.findUnique({
            where: { id },
            select: {
                id: true, name: true, email: true, phone: true,
                isActive: true, whatsappOptedIn: true, createdAt: true, lastLoginAt: true,
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                    include: {
                        service: { select: { name: true } },
                        plan: { select: { name: true } },
                    },
                },
            },
        });
        if (!customer) throw new BadRequestException('Customer not found');
        return customer;
    }

    async toggleCustomerActive(id: string, isActive: boolean) {
        return this.prisma.customerAccount.update({
            where: { id },
            data: { isActive },
            select: { id: true, email: true, isActive: true },
        });
    }

    // ─── Subscription / Expiry Management ────────────────

    async findAllSubscriptions(filters?: {
        status?: string;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 25;
        const skip = (page - 1) * limit;
        const where: any = {};

        if (filters?.status) where.status = filters.status;
        if (filters?.search) {
            where.customerEmail = { contains: filters.search, mode: 'insensitive' };
        }

        const [items, total] = await Promise.all([
            this.prisma.subscriptionExpiry.findMany({
                where,
                orderBy: { expiresAt: 'asc' },
                skip,
                take: limit,
                include: {
                    order: {
                        select: {
                            customerName: true,
                            customerPhone: true,
                            service: { select: { name: true } },
                            plan: { select: { name: true } },
                        },
                    },
                },
            }),
            this.prisma.subscriptionExpiry.count({ where }),
        ]);

        return { items, total, page, limit };
    }

    // ─── Reporting ────────────────────────────────────────

    async getRevenueByService() {
        const result = await this.prisma.$queryRaw`
            SELECT s."name" as "serviceName", SUM(o."amountPaid"::numeric) as "totalRevenue", COUNT(o.id) as "orderCount"
            FROM "Order" o
            JOIN "Service" s ON o."serviceId" = s.id
            WHERE o."paymentStatus" = 'CONFIRMED'
            GROUP BY s."name"
            ORDER BY "totalRevenue" DESC
        ` as any[];
        return result.map((r: any) => ({
            serviceName: r.serviceName,
            totalRevenue: Number(r.totalRevenue),
            orderCount: Number(r.orderCount),
        }));
    }

    async getRevenueByPlan() {
        const result = await this.prisma.$queryRaw`
            SELECT p."name" as "planName", s."name" as "serviceName",
                   SUM(o."amountPaid"::numeric) as "totalRevenue", COUNT(o.id) as "orderCount"
            FROM "Order" o
            JOIN "Plan" p ON o."planId" = p.id
            JOIN "Service" s ON o."serviceId" = s.id
            WHERE o."paymentStatus" = 'CONFIRMED'
            GROUP BY p."name", s."name"
            ORDER BY "totalRevenue" DESC
        ` as any[];
        return result.map((r: any) => ({
            planName: r.planName,
            serviceName: r.serviceName,
            totalRevenue: Number(r.totalRevenue),
            orderCount: Number(r.orderCount),
        }));
    }

    async getCouponPerformance() {
        const coupons = await this.prisma.coupon.findMany({
            select: {
                id: true, code: true, discountType: true, discountValue: true,
                usedCount: true, maxUses: true, isActive: true, expiresAt: true,
            },
            orderBy: { usedCount: 'desc' },
        });
        return coupons;
    }

    async getOrdersExport(format: 'json') {
        // Returns all confirmed orders for CSV generation on client
        return this.prisma.order.findMany({
            where: { paymentStatus: 'CONFIRMED' },
            orderBy: { createdAt: 'desc' },
            include: {
                service: { select: { name: true } },
                plan: { select: { name: true } },
            },
        });
    }

    // ─── Admin User Management ────────────────────────────

    async findAllAdmins() {
        return this.prisma.admin.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                totpEnabled: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    async createAdmin(data: {
        name: string;
        email: string;
        password: string;
        role?: string;
    }) {
        const existing = await this.prisma.admin.findUnique({
            where: { email: data.email },
        });
        if (existing) throw new BadRequestException('Email already exists');

        const passwordHash = await bcrypt.hash(data.password, 12);
        return this.prisma.admin.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash,
                role: (data.role as any) || 'MANAGER',
            },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
        });
    }

    async updateAdmin(id: string, data: Partial<{ name: string; email: string; role: string; isActive: boolean }>) {
        return this.prisma.admin.update({
            where: { id },
            data: data as any,
            select: { id: true, name: true, email: true, role: true, isActive: true },
        });
    }

    // ─── Audit Logs ───────────────────────────────────────

    async getAuditLogs(page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.prisma.auditLog.findMany({
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            this.prisma.auditLog.count(),
        ]);
        return { items, total, page, limit };
    }

    async createAuditLog(data: {
        adminId: string;
        action: string;
        entityType: string;
        entityId: string;
        oldValue?: any;
        newValue?: any;
        ipAddress?: string;
    }) {
        return this.prisma.auditLog.create({ data });
    }
}
