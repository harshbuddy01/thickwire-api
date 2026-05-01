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
exports.CouponsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let CouponsService = class CouponsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll() {
        return this.prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
    }
    async findOne(id) {
        return this.prisma.coupon.findUnique({ where: { id } });
    }
    async create(dto) {
        try {
            return await this.prisma.coupon.create({
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
        catch (error) {
            if (error.code === 'P2002') {
                throw new common_1.ConflictException('A coupon with this code already exists');
            }
            throw error;
        }
    }
    async update(id, dto) {
        return this.prisma.coupon.update({
            where: { id },
            data: {
                ...dto,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
            },
        });
    }
    async delete(id) {
        return this.prisma.coupon.update({ where: { id }, data: { isActive: false } });
    }
    async getUsage(id) {
        return this.prisma.couponUsage.findMany({
            where: { couponId: id },
            orderBy: { usedAt: 'desc' },
        });
    }
    async validateCoupon(code, planId, amount, customerId) {
        const coupon = await this.prisma.coupon.findUnique({ where: { code: code.toUpperCase() } });
        if (!coupon)
            throw new common_1.BadRequestException('Invalid coupon code');
        if (!coupon.isActive)
            throw new common_1.BadRequestException('This coupon is no longer active');
        const now = new Date();
        if (now < coupon.startsAt)
            throw new common_1.BadRequestException('This coupon is not yet active');
        if (coupon.expiresAt && now > coupon.expiresAt)
            throw new common_1.BadRequestException('This coupon has expired');
        if (coupon.maxUses && coupon.usedCount >= coupon.maxUses)
            throw new common_1.BadRequestException('This coupon has reached its usage limit');
        if (coupon.applicablePlanIds.length > 0 && !coupon.applicablePlanIds.includes(planId)) {
            throw new common_1.BadRequestException('This coupon is not valid for this plan');
        }
        if (coupon.minOrderAmount && amount < Number(coupon.minOrderAmount)) {
            throw new common_1.BadRequestException(`Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon`);
        }
        if (customerId) {
            const existingUsage = await this.prisma.couponUsage.findFirst({
                where: { couponId: coupon.id, customerId },
            });
            if (existingUsage)
                throw new common_1.BadRequestException('You have already used this coupon');
        }
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
    async applyCoupon(couponId, orderId, customerId) {
        await this.prisma.coupon.update({
            where: { id: couponId },
            data: { usedCount: { increment: 1 } },
        });
        await this.prisma.couponUsage.create({
            data: { couponId, orderId, customerId },
        });
    }
    calculateDiscount(type, value, orderAmount, maxCap) {
        if (type === 'FLAT') {
            return Math.min(value, orderAmount);
        }
        const discount = (orderAmount * value) / 100;
        if (maxCap)
            return Math.min(discount, maxCap);
        return discount;
    }
    async bulkGenerate(count, prefix, dto) {
        const codes = [];
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
};
exports.CouponsService = CouponsService;
exports.CouponsService = CouponsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CouponsService);
//# sourceMappingURL=coupons.service.js.map