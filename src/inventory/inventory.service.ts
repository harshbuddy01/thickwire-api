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

    async findByPlan(planId: string, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
            this.prisma.inventory.findMany({
                where: { planId },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                select: {
                    id: true,
                    contentEncrypted: true,
                    isUsed: true,
                    usedAt: true,
                    orderId: true,
                    createdAt: true,
                    order: {
                        select: {
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
                    },
                },
            }),
            this.prisma.inventory.count({ where: { planId } }),
        ]);

        // Decrypt credentials for admin view
        const decryptedItems = items.map((item) => {
            let decryptedContent = '';
            try {
                decryptedContent = this.encryption.decrypt(item.contentEncrypted);
            } catch (e) {
                decryptedContent = '[decryption failed]';
            }
            const { contentEncrypted, ...rest } = item;
            return { ...rest, decryptedContent };
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
