import { Request } from 'express';
import { InventoryService } from './inventory.service';
export declare class InventoryController {
    private readonly inventoryService;
    constructor(inventoryService: InventoryService);
    addSingle(body: {
        planId: string;
        content: string;
    }, req: Request): Promise<{
        id: string;
        planId: string;
        createdAt: Date;
    }>;
    addBulk(body: {
        planId: string;
        contents: string[];
    }, req: Request): Promise<{
        count: number;
    }>;
    findByPlan(planId: string, page?: number, limit?: number): Promise<{
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
}
