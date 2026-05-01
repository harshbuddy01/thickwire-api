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
var InventoryService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.InventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const encryption_service_1 = require("../common/encryption.service");
const redis_service_1 = require("../redis/redis.service");
let InventoryService = InventoryService_1 = class InventoryService {
    constructor(prisma, encryption, redis) {
        this.prisma = prisma;
        this.encryption = encryption;
        this.redis = redis;
        this.logger = new common_1.Logger(InventoryService_1.name);
    }
    async addSingle(planId, content, adminId) {
        const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan)
            throw new common_1.BadRequestException('Plan not found');
        const encrypted = this.encryption.encrypt(content);
        const item = await this.prisma.inventory.create({
            data: {
                planId,
                contentEncrypted: encrypted,
                uploadedByAdminId: adminId,
            },
        });
        await this.redis.delByPattern('services:*');
        return { id: item.id, planId, createdAt: item.createdAt };
    }
    async addBulk(planId, contents, adminId) {
        const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan)
            throw new common_1.BadRequestException('Plan not found');
        const data = contents.map((c) => ({
            planId,
            contentEncrypted: this.encryption.encrypt(c),
            uploadedByAdminId: adminId,
        }));
        const result = await this.prisma.inventory.createMany({ data });
        await this.redis.delByPattern('services:*');
        return { count: result.count };
    }
    async findByPlan(planId, page = 1, limit = 50) {
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.max(1, parseInt(limit) || 50);
        const skip = (pageNum - 1) * limitNum;
        const [items, total] = await Promise.all([
            this.prisma.inventory.findMany({
                where: { planId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum,
                select: {
                    id: true,
                    contentEncrypted: true,
                    isUsed: true,
                    usedAt: true,
                    orderId: true,
                    createdAt: true,
                },
            }),
            this.prisma.inventory.count({ where: { planId } }),
        ]);
        const orderIds = items.map(i => i.orderId).filter(Boolean);
        const orders = orderIds.length > 0
            ? await this.prisma.order.findMany({
                where: { id: { in: orderIds } },
                select: {
                    id: true,
                    customerName: true,
                    customerEmail: true,
                    subscriptionExpiry: {
                        select: {
                            expiresAt: true,
                            activatedAt: true,
                            status: true,
                        },
                    },
                },
            })
            : [];
        const orderMap = new Map(orders.map(o => [o.id, o]));
        const decryptedItems = items.map((item) => {
            let decryptedContent = '';
            try {
                decryptedContent = this.encryption.decrypt(item.contentEncrypted);
            }
            catch (e) {
                decryptedContent = '[decryption failed]';
            }
            const { contentEncrypted, ...rest } = item;
            return {
                ...rest,
                decryptedContent,
                order: item.orderId ? orderMap.get(item.orderId) || null : null,
            };
        });
        return { items: decryptedItems, total, page, limit };
    }
    async getStockCounts() {
        const counts = await this.prisma.inventory.groupBy({
            by: ['planId'],
            where: { isUsed: false },
            _count: { id: true },
        });
        return counts.map((c) => ({ planId: c.planId, available: c._count.id }));
    }
    async decryptContent(inventoryId) {
        const item = await this.prisma.inventory.findUnique({
            where: { id: inventoryId },
        });
        if (!item)
            throw new common_1.BadRequestException('Inventory item not found');
        return this.encryption.decrypt(item.contentEncrypted);
    }
};
exports.InventoryService = InventoryService;
exports.InventoryService = InventoryService = InventoryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        encryption_service_1.EncryptionService,
        redis_service_1.RedisService])
], InventoryService);
//# sourceMappingURL=inventory.service.js.map