import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EncryptionService } from '../common/encryption.service';

@Injectable()
export class AccountService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly encryption: EncryptionService,
    ) { }

    async getOrders(customerId: string) {
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

    async getOrderDetail(customerId: string, orderId: string) {
        return this.prisma.order.findFirst({
            where: { id: orderId, customerId },
            include: {
                service: { select: { name: true, slug: true, logoUrl: true } },
                plan: { select: { name: true, slug: true, durationDays: true, price: true } },
                subscriptionExpiry: true,
            },
        });
    }

    async getSubscriptions(customerId: string) {
        return this.prisma.subscriptionExpiry.findMany({
            where: { customerId },
            orderBy: { expiresAt: 'asc' },
        });
    }

    async updatePreferences(customerId: string, dto: { whatsappOptedIn?: boolean; phone?: string }) {
        return this.prisma.customerAccount.update({
            where: { id: customerId },
            data: dto,
            select: { id: true, phone: true, whatsappOptedIn: true },
        });
    }

    async getOrderCredential(customerId: string, orderId: string) {
        // Find the order belonging to this customer
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
            throw new NotFoundException('Credential not found for this order');
        }

        // Fetch the inventory item
        const inventory = await this.prisma.inventory.findUnique({
            where: { id: order.inventoryId },
        });

        if (!inventory) {
            throw new NotFoundException('Credential not found');
        }

        // Decrypt the credential
        const credential = this.encryption.decrypt(inventory.contentEncrypted);

        return {
            credential,
            activatedAt: order.subscriptionExpiry?.activatedAt || null,
            expiresAt: order.subscriptionExpiry?.expiresAt || null,
            status: order.subscriptionExpiry?.status || null,
        };
    }
}
