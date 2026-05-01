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
var AutomationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const encryption_service_1 = require("../common/encryption.service");
let AutomationService = AutomationService_1 = class AutomationService {
    constructor(prisma, encryption) {
        this.prisma = prisma;
        this.encryption = encryption;
        this.logger = new common_1.Logger(AutomationService_1.name);
    }
    async assignInventory(orderId, planId) {
        const result = await this.prisma.$transaction(async (tx) => {
            const items = await tx.$queryRaw `
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
            await tx.inventory.update({
                where: { id: item.id },
                data: {
                    isUsed: true,
                    usedAt: new Date(),
                    orderId,
                },
            });
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
        if (result) {
            await this.createSubscriptionExpiry(orderId);
        }
        return result;
    }
    async createSubscriptionExpiry(orderId) {
        try {
            const order = await this.prisma.order.findUnique({
                where: { id: orderId },
                include: { plan: true, service: true },
            });
            if (!order || !order.plan)
                return;
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
        }
        catch (err) {
            this.logger.error(`Failed to create subscription expiry for order ${orderId}: ${err.message}`);
        }
    }
};
exports.AutomationService = AutomationService;
exports.AutomationService = AutomationService = AutomationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        encryption_service_1.EncryptionService])
], AutomationService);
//# sourceMappingURL=automation.service.js.map