import { CouponsService } from './coupons.service';
export declare class CouponsController {
    private readonly couponsService;
    constructor(couponsService: CouponsService);
    validateCoupon(body: {
        code: string;
        planId: string;
        amount: number;
        customerId?: string;
    }): Promise<{
        valid: boolean;
        couponId: string;
        code: string;
        discountType: import(".prisma/client").$Enums.DiscountType;
        discountValue: number;
        discountAmount: number;
        finalAmount: number;
    }>;
    findAll(): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        code: string;
        expiresAt: Date | null;
        description: string | null;
        discountType: import(".prisma/client").$Enums.DiscountType;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        maxUses: number | null;
        usedCount: number;
        minOrderAmount: import("@prisma/client/runtime/library").Decimal | null;
        maxDiscountAmount: import("@prisma/client/runtime/library").Decimal | null;
        applicableServiceIds: string[];
        applicablePlanIds: string[];
        startsAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        code: string;
        expiresAt: Date | null;
        description: string | null;
        discountType: import(".prisma/client").$Enums.DiscountType;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        maxUses: number | null;
        usedCount: number;
        minOrderAmount: import("@prisma/client/runtime/library").Decimal | null;
        maxDiscountAmount: import("@prisma/client/runtime/library").Decimal | null;
        applicableServiceIds: string[];
        applicablePlanIds: string[];
        startsAt: Date;
    } | null>;
    create(body: any): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        code: string;
        expiresAt: Date | null;
        description: string | null;
        discountType: import(".prisma/client").$Enums.DiscountType;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        maxUses: number | null;
        usedCount: number;
        minOrderAmount: import("@prisma/client/runtime/library").Decimal | null;
        maxDiscountAmount: import("@prisma/client/runtime/library").Decimal | null;
        applicableServiceIds: string[];
        applicablePlanIds: string[];
        startsAt: Date;
    }>;
    update(id: string, body: any): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        code: string;
        expiresAt: Date | null;
        description: string | null;
        discountType: import(".prisma/client").$Enums.DiscountType;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        maxUses: number | null;
        usedCount: number;
        minOrderAmount: import("@prisma/client/runtime/library").Decimal | null;
        maxDiscountAmount: import("@prisma/client/runtime/library").Decimal | null;
        applicableServiceIds: string[];
        applicablePlanIds: string[];
        startsAt: Date;
    }>;
    deactivate(id: string): Promise<{
        id: string;
        isActive: boolean;
        createdAt: Date;
        code: string;
        expiresAt: Date | null;
        description: string | null;
        discountType: import(".prisma/client").$Enums.DiscountType;
        discountValue: import("@prisma/client/runtime/library").Decimal;
        maxUses: number | null;
        usedCount: number;
        minOrderAmount: import("@prisma/client/runtime/library").Decimal | null;
        maxDiscountAmount: import("@prisma/client/runtime/library").Decimal | null;
        applicableServiceIds: string[];
        applicablePlanIds: string[];
        startsAt: Date;
    }>;
    getUsage(id: string): Promise<{
        id: string;
        customerId: string | null;
        couponId: string;
        orderId: string;
        usedAt: Date;
    }[]>;
    bulkGenerate(body: {
        count: number;
        prefix: string;
        discountType: 'PERCENT' | 'FLAT';
        discountValue: number;
        maxUses?: number;
        expiresAt?: string;
    }): Promise<{
        generated: number;
        codes: string[];
    }>;
}
