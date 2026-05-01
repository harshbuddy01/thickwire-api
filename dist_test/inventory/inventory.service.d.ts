import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';
import { RedisService } from '../redis/redis.service';
export declare class InventoryService {
    private readonly prisma;
    private readonly encryption;
    private readonly redis;
    private readonly logger;
    constructor(prisma: PrismaService, encryption: EncryptionService, redis: RedisService);
    addSingle(planId: string, content: string, adminId: string): Promise<{
        id: string;
        planId: string;
        createdAt: Date;
    }>;
    addBulk(planId: string, contents: string[], adminId: string): Promise<{
        count: number;
    }>;
    findByPlan(planId: string, page?: number | string, limit?: number | string): Promise<{
        items: {
            decryptedContent: string;
            order: {
                subscriptionExpiry: {
                    expiresAt: Date;
                    activatedAt: Date;
                    status: import(".prisma/client").$Enums.ExpiryStatus;
                } | null;
                id: string;
                customerEmail: string;
                customerName: string;
            } | null;
            id: string;
            createdAt: Date;
            orderId: string | null;
            isUsed: boolean;
            usedAt: Date | null;
        }[];
        total: number;
        page: string | number;
        limit: string | number;
    }>;
    getStockCounts(): Promise<{
        planId: string;
        available: number;
    }[]>;
    decryptContent(inventoryId: string): Promise<string>;
}
