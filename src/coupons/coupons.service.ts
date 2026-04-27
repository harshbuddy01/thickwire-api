import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class CouponsService {
    constructor(private readonly prisma: PrismaService) { }

    // ── Admin CRUD ─────────────────────────────────────
    async findAll() {
        return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    }

    async findOne(id: string) {
        return this.prisma.coupon.findUnique({ where: { id } });
    }

    async create(dto: {
        code: string;
        description?: string;
        discountType: 'PERCENT' | 'FLAT';
        discountValue: number;
        maxUses?: number;
        minOrderAmount?: number;
        maxDiscountAmount?: number;
        applicableServiceIds?: string[];
        applicablePlanIds?: string[];
        startsAt?: string;
        expiresAt?: string;
    }) {
        return this.prisma.coupon.create({
            data: {
                code: dto.code.toUpperCase(),
                description: dto.description,
                discountType: dto.discountType,
                discountValue: dto.discountValue,
                maxUses: dto.maxUses,
                minOrderAmount: dto.minOrderAmount,
                maxDiscountAmount: dto.maxDiscountAmount,
                applicableServiceIds: dto.applicableServiceIds || [],
                applicablePlanIds: dto.applicablePlanIds || [],
                startsAt: dto.startsAt ? new Date(dto.startsAt) : new Date(),
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
            },
        });
    }

    async update(id: string, dto: Partial<{
        description: string;
        discountType: 'PERCENT' | 'FLAT';
        discountValue: number;
        maxUses: number;
        minOrderAmount: number;
        maxDiscountAmount: number;
        applicableServiceIds: string[];
        applicablePlanIds: string[];
        expiresAt: string;
        isActive: boolean;
    }>) {
        return this.prisma.coupon.update({
            where: { id },
            data: {
                ...dto,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
            },
        });
    }

    async delete(id: string) {
        return this.prisma.coupon.update({ where: { id }, data: { isActive: false } });
    }

    async getUsage(id: string) {
        return this.prisma.couponUsage.findMany({
            where: { couponId: id },
            orderBy: { usedAt: 'desc' },
        });
    }

    // ── Public Validation ──────────────────────────────
    async validateCoupon(code: string, planId: string, amount: number, customerId?: string) {
        const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
        if (!coupon) throw new BadRequestException('Invalid coupon code');
        if (!coupon.isActive) throw new BadRequestException('This coupon is no longer active');

        const now = new Date();
        if (now < coupon.startsAt) throw new BadRequestException('This coupon is not yet active');
        if (coupon.expiresAt && now > coupon.expiresAt) throw new BadRequestException('This coupon has expired');
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) throw new BadRequestException('This coupon has reached its usage limit');

        if (coupon.applicablePlanIds.length > 0 && !coupon.applicablePlanIds.includes(planId)) {
            throw new BadRequestException('This coupon is not valid for this plan');
        }

        if (coupon.minOrderAmount && amount < Number(coupon.minOrderAmount)) {
            throw new BadRequestException(`Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`);
        }

        // Check per-customer usage
        if (customerId) {
            const existingUsage = await this.prisma.couponUsage.findFirst({
                where: { couponId: coupon.id, customerId },
            });
            if (existingUsage) throw new BadRequestException('You have already used this coupon');
        }

        // Calculate discount
        const discount = this.calculateDiscount(coupon.discountType, Number(coupon.discountValue), amount, coupon.maxDiscountAmount ? Number(coupon.maxDiscountAmount) : null);

        return {
            valid: true,
            couponId: coupon.id,
            code: coupon.code,
            discountType: coupon.discountType,
            discountValue: Number(coupon.discountValue),
            discountAmount: discount,
            finalAmount: amount - discount,
        };
    }

    // ── Apply coupon to an order (called from orders service) ──
    async applyCoupon(couponId: string, orderId: string, customerId?: string) {
        await this.prisma.coupon.update({
            where: { id: couponId },
            data: { usedCount: { increment: 1 } },
        });
        await this.prisma.couponUsage.create({
            data: { couponId, orderId, customerId },
        });
    }

    // ── Helpers ────────────────────────────────────────
    private calculateDiscount(type: string, value: number, orderAmount: number, maxCap: number | null): number {
        if (type === 'FLAT') {
            return Math.min(value, orderAmount);
        }
        // PERCENT
        const discount = (orderAmount * value) / 100;
        if (maxCap) return Math.min(discount, maxCap);
        return discount;
    }

    // ── Bulk Generate ──────────────────────────────────
    async bulkGenerate(count: number, prefix: string, dto: {
        discountType: 'PERCENT' | 'FLAT';
        discountValue: number;
        maxUses?: number;
        expiresAt?: string;
    }) {
        const codes: string[] = [];
        for (let i = 0; i < count; i++) {
            const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
            const code = `${prefix}${suffix}`;
            await this.prisma.coupon.create({
                data: {
                    code,
                    discountType: dto.discountType,
                    discountValue: dto.discountValue,
                    maxUses: dto.maxUses ?? 1,
                    expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
                },
            });
            codes.push(code);
        }
        return { generated: codes.length, codes };
    }
}
