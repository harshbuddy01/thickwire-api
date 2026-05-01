import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';
export declare class AutomationService {
    private readonly prisma;
    private readonly encryption;
    private readonly logger;
    constructor(prisma: PrismaService, encryption: EncryptionService);
    assignInventory(orderId: string, planId: string): Promise<{
        inventoryId: string;
        content: string;
    } | null>;
    private createSubscriptionExpiry;
}
