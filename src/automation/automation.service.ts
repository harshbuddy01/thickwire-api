import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';

@Injectable()
export class AutomationService {
    private readonly logger = new Logger(AutomationService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly encryption: EncryptionService,
    ) { }

    /**
     * Assigns an available inventory item to an order using row-level locking.
     * Uses raw SQL with FOR UPDATE SKIP LOCKED to prevent race conditions.
     * Returns the decrypted content if successful, null if no stock.
     */
    async assignInventory(
        orderId: string,
        planId: string,
    ): Promise<{ inventoryId: string; content: string } | null> {
        // Use a transaction with row-level locking
        const result = await this.prisma.$transaction(async (tx) => {
            // Find and lock an available inventory item
            const items = await tx.$queryRaw<{ id: string; contentEncrypted: string }[]>`
        SELECT id, "contentEncrypted"
        FROM "Inventory"
        WHERE "planId" = ${planId}
          AND "isUsed" = false
        ORDER BY "createdAt" ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      `;

            if (!items || items.length === 0) {
                this.logger.warn(`No stock available for plan ${planId}, order ${orderId}`);
                return null;
            }

            const item = items[0];

            // Mark as used and link to order
            await tx.inventory.update({
                where: { id: item.id },
                data: {
                    isUsed: true,
                    usedAt: new Date(),
                    orderId,
                },
            });

            // Update order fulfillment status
            await tx.order.update({
                where: { id: orderId },
                data: {
                    fulfillmentStatus: 'FULFILLED',
                    inventoryId: item.id,
                    deliveredAt: new Date(),
                },
            });

            const content = this.encryption.decrypt(item.contentEncrypted);

            this.logger.log(`Assigned inventory ${item.id} to order ${orderId}`);
            return { inventoryId: item.id, content };
        });

        // Phase 2: Create subscription expiry record after successful fulfillment
        if (result) {
            await this.createSubscriptionExpiry(orderId);
        }

        return result;
    }

    /**
     * Phase 2: Creates a SubscriptionExpiry record for a fulfilled order.
     * Calculates expiresAt = activatedAt + plan.durationDays
     */
    private async createSubscriptionExpiry(orderId: string) {
        try {
            const order = await this.prisma.order.findUnique({
                where: { id: orderId },
                include: { plan: true, service: true },
            });

            if (!order || !order.plan) return;

            const activatedAt = new Date();
            const expiresAt = new Date(activatedAt);
            expiresAt.setDate(expiresAt.getDate() + order.plan.durationDays);

            await this.prisma.subscriptionExpiry.create({
                data: {
                    orderId: order.id,
                    customerId: order.customerId ?? null,
                    customerEmail: order.customerEmail,
                    planId: order.planId,
                    serviceId: order.serviceId,
                    serviceName: order.service?.name || 'Unknown',
                    planName: order.plan.name,
                    activatedAt,
                    expiresAt,
                    status: 'ACTIVE',
                },
            });

            this.logger.log(`Created subscription expiry for order ${orderId}, expires ${expiresAt.toISOString()}`);
        } catch (err) {
            this.logger.error(`Failed to create subscription expiry for order ${orderId}: ${(err as Error).message}`);
            // Non-blocking — log but do not throw, order is already fulfilled
        }
    }
}

