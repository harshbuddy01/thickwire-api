import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AccountService {
    constructor(private readonly prisma: PrismaService) { }

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
}
