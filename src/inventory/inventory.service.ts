import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class InventoryService {
    private readonly logger = new Logger(InventoryService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly encryption: EncryptionService,
        private readonly redis: RedisService,
    ) { }

    async addSingle(planId: string, content: string, adminId: string) {
        const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) throw new BadRequestException('Plan not found');

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

    async addBulk(planId: string, contents: string[], adminId: string) {
        const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) throw new BadRequestException('Plan not found');

        const data = contents.map((c) => ({
            planId,
            contentEncrypted: this.encryption.encrypt(c),
            uploadedByAdminId: adminId,
        }));

        const result = await this.prisma.inventory.createMany({ data });
        await this.redis.delByPattern('services:*');
        return { count: result.count };
    }

    async findByPlan(planId: string, page: number | string = 1, limit: number | string = 50) {
        const pageNum = Math.max(1, parseInt(page as string) || 1);
        const limitNum = Math.max(1, parseInt(limit as string) || 50);
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

        // Batch-fetch linked orders for used items
        const orderIds = items.map(i => i.orderId).filter(Boolean) as string[];
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

        // Decrypt credentials and attach order data
        const decryptedItems = items.map((item) => {
            let decryptedContent = '';
            try {
                decryptedContent = this.encryption.decrypt(item.contentEncrypted);
            } catch (e) {
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

    async decryptContent(inventoryId: string): Promise<string> {
        const item = await this.prisma.inventory.findUnique({
            where: { id: inventoryId },
        });
        if (!item) throw new BadRequestException('Inventory item not found');
        return this.encryption.decrypt(item.contentEncrypted);
    }
}
