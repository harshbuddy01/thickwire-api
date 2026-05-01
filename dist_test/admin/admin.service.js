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
var AdminService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const encryption_service_1 = require("../common/encryption.service");
const bcrypt = require("bcrypt");
let AdminService = AdminService_1 = class AdminService {
    constructor(prisma, encryption) {
        this.prisma = prisma;
        this.encryption = encryption;
        this.logger = new common_1.Logger(AdminService_1.name);
    }
    async getDashboardStats() {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const [totalOrders, confirmedOrders, revenueResult, pendingOrders, totalServices, openTickets, recentOrders, dailyRevenue, activeCustomers, expiringThisWeek,] = await Promise.all([
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
            this.prisma.$queryRaw `
        SELECT DATE("createdAt") as date, SUM("amountPaid"::numeric) as total
        FROM "Order"
        WHERE "paymentStatus" = 'CONFIRMED'
          AND "createdAt" >= ${sevenDaysAgo}
        GROUP BY DATE("createdAt")
        ORDER BY date ASC
      `,
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
    async findAllCustomers(filters) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 25;
        const skip = (page - 1) * limit;
        const where = {};
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
    async getCustomerDetail(id) {
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
        if (!customer)
            throw new common_1.BadRequestException('Customer not found');
        return customer;
    }
    async toggleCustomerActive(id, isActive) {
        return this.prisma.customerAccount.update({
            where: { id },
            data: { isActive },
            select: { id: true, email: true, isActive: true },
        });
    }
    async findAllSubscriptions(filters) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 25;
        const skip = (page - 1) * limit;
        const where = {};
        if (filters?.status)
            where.status = filters.status;
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
    async getDeliveredCredentials(filters) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 25;
        const skip = (page - 1) * limit;
        const where = {
            fulfillmentStatus: 'FULFILLED',
            inventoryId: { not: null },
        };
        const [items, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                orderBy: { deliveredAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    customerName: true,
                    customerEmail: true,
                    deliveredAt: true,
                    service: { select: { name: true } },
                    plan: { select: { name: true } },
                    subscriptionExpiry: {
                        select: {
                            status: true,
                            activatedAt: true,
                            expiresAt: true,
                        },
                    },
                },
            }),
            this.prisma.order.count({ where }),
        ]);
        return { items, total, page, limit };
    }
    async getOrderCredentialForAdmin(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                customerName: true,
                customerEmail: true,
                inventoryId: true,
                deliveredAt: true,
                service: { select: { name: true } },
                plan: { select: { name: true } },
                subscriptionExpiry: {
                    select: {
                        activatedAt: true,
                        expiresAt: true,
                        status: true,
                    },
                },
            },
        });
        if (!order || !order.inventoryId) {
            throw new common_1.NotFoundException('Credential not found for this order');
        }
        const inventory = await this.prisma.inventory.findUnique({
            where: { id: order.inventoryId },
        });
        if (!inventory) {
            throw new common_1.NotFoundException('Inventory item not found');
        }
        const credential = this.encryption.decrypt(inventory.contentEncrypted);
        return {
            orderId: order.id,
            customerName: order.customerName,
            customerEmail: order.customerEmail,
            serviceName: order.service?.name,
            planName: order.plan?.name,
            credential,
            deliveredAt: order.deliveredAt,
            activatedAt: order.subscriptionExpiry?.activatedAt || null,
            expiresAt: order.subscriptionExpiry?.expiresAt || null,
            status: order.subscriptionExpiry?.status || null,
        };
    }
    async getRevenueByService() {
        const result = await this.prisma.$queryRaw `
            SELECT s."name" as "serviceName", SUM(o."amountPaid"::numeric) as "totalRevenue", COUNT(o.id) as "orderCount"
            FROM "Order" o
            JOIN "Service" s ON o."serviceId" = s.id
            WHERE o."paymentStatus" = 'CONFIRMED'
            GROUP BY s."name"
            ORDER BY "totalRevenue" DESC
        `;
        return result.map((r) => ({
            serviceName: r.serviceName,
            totalRevenue: Number(r.totalRevenue),
            orderCount: Number(r.orderCount),
        }));
    }
    async getRevenueByPlan() {
        const result = await this.prisma.$queryRaw `
            SELECT p."name" as "planName", s."name" as "serviceName",
                   SUM(o."amountPaid"::numeric) as "totalRevenue", COUNT(o.id) as "orderCount"
            FROM "Order" o
            JOIN "Plan" p ON o."planId" = p.id
            JOIN "Service" s ON o."serviceId" = s.id
            WHERE o."paymentStatus" = 'CONFIRMED'
            GROUP BY p."name", s."name"
            ORDER BY "totalRevenue" DESC
        `;
        return result.map((r) => ({
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
    async getOrdersExport(format) {
        return this.prisma.order.findMany({
            where: { paymentStatus: 'CONFIRMED' },
            orderBy: { createdAt: 'desc' },
            include: {
                service: { select: { name: true } },
                plan: { select: { name: true } },
            },
        });
    }
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
    async createAdmin(data) {
        const existing = await this.prisma.admin.findUnique({
            where: { email: data.email },
        });
        if (existing)
            throw new common_1.BadRequestException('Email already exists');
        const passwordHash = await bcrypt.hash(data.password, 12);
        return this.prisma.admin.create({
            data: {
                name: data.name,
                email: data.email,
                passwordHash,
                role: data.role || 'MANAGER',
            },
            select: { id: true, name: true, email: true, role: true, createdAt: true },
        });
    }
    async updateAdmin(id, data) {
        return this.prisma.admin.update({
            where: { id },
            data: data,
            select: { id: true, name: true, email: true, role: true, isActive: true },
        });
    }
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
    async createAuditLog(data) {
        return this.prisma.auditLog.create({ data });
    }
};
exports.AdminService = AdminService;
exports.AdminService = AdminService = AdminService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        encryption_service_1.EncryptionService])
], AdminService);
//# sourceMappingURL=admin.service.js.map