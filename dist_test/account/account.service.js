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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AccountService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const encryption_service_1 = require("../common/encryption.service");
let AccountService = class AccountService {
    constructor(prisma, encryption) {
        this.prisma = prisma;
        this.encryption = encryption;
    }
    async getOrders(customerId) {
        return this.prisma.order.findMany({
            where: { customerId },
            orderBy: { createdAt: 'desc' },
            include: {
                service: { select: { name: true, slug: true, logoUrl: true } },
                plan: { select: { name: true, slug: true, durationDays: true } },
                subscriptionExpiry: {
                    select: { status: true, expiresAt: true, activatedAt: true },
                },
            },
        });
    }
    async getOrderDetail(customerId, orderId) {
        return this.prisma.order.findFirst({
            where: { id: orderId, customerId },
            include: {
                service: { select: { name: true, slug: true, logoUrl: true } },
                plan: { select: { name: true, slug: true, durationDays: true, price: true } },
                subscriptionExpiry: true,
            },
        });
    }
    async getSubscriptions(customerId) {
        return this.prisma.subscriptionExpiry.findMany({
            where: { customerId },
            orderBy: { expiresAt: 'asc' },
        });
    }
    async updatePreferences(customerId, dto) {
        return this.prisma.customerAccount.update({
            where: { id: customerId },
            data: dto,
            select: { id: true, phone: true, whatsappOptedIn: true },
        });
    }
    async getOrderCredential(customerId, orderId) {
        const order = await this.prisma.order.findFirst({
            where: { id: orderId, customerId },
            select: {
                id: true,
                inventoryId: true,
                fulfillmentStatus: true,
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
            throw new common_1.NotFoundException('Credential not found');
        }
        const credential = this.encryption.decrypt(inventory.contentEncrypted);
        return {
            credential,
            activatedAt: order.subscriptionExpiry?.activatedAt || null,
            expiresAt: order.subscriptionExpiry?.expiresAt || null,
            status: order.subscriptionExpiry?.status || null,
        };
    }
};
exports.AccountService = AccountService;
exports.AccountService = AccountService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        encryption_service_1.EncryptionService])
], AccountService);
//# sourceMappingURL=account.service.js.map