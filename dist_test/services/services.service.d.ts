import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
export declare class ServicesService {
    private readonly prisma;
    private readonly redis;
    private readonly logger;
    private readonly CACHE_TTL;
    constructor(prisma: PrismaService, redis: RedisService);
    findAllActive(): Promise<any[]>;
    findBySlug(slug: string): Promise<any>;
    findAll(): Promise<({
        _count: {
            orders: number;
            plans: number;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        logoUrl: string | null;
        description: string | null;
        displayOrder: number;
        deletedAt: Date | null;
    })[]>;
    create(data: {
        name: string;
        slug: string;
        logoUrl?: string;
        description?: string;
        displayOrder?: number;
    }): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        logoUrl: string | null;
        description: string | null;
        displayOrder: number;
        deletedAt: Date | null;
    }>;
    update(id: string, data: Partial<{
        name: string;
        slug: string;
        logoUrl: string;
        description: string;
        displayOrder: number;
        isActive: boolean;
    }>): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        slug: string;
        logoUrl: string | null;
        description: string | null;
        displayOrder: number;
        deletedAt: Date | null;
    }>;
    softDelete(id: string): Promise<void>;
    findPlans(serviceId: string): Promise<({
        _count: {
            inventory: number;
        };
    } & {
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        serviceId: string;
        slug: string;
        description: string | null;
        displayOrder: number;
        deletedAt: Date | null;
        price: import("@prisma/client/runtime/library").Decimal;
        originalPrice: import("@prisma/client/runtime/library").Decimal | null;
        durationDays: number;
    })[]>;
    createPlan(data: {
        serviceId: string;
        name: string;
        slug: string;
        description?: string;
        price: number;
        originalPrice?: number;
        durationDays: number;
        displayOrder?: number;
    }): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        serviceId: string;
        slug: string;
        description: string | null;
        displayOrder: number;
        deletedAt: Date | null;
        price: import("@prisma/client/runtime/library").Decimal;
        originalPrice: import("@prisma/client/runtime/library").Decimal | null;
        durationDays: number;
    }>;
    updatePlan(id: string, data: Partial<{
        name: string;
        slug: string;
        description: string;
        price: number;
        originalPrice: number;
        durationDays: number;
        displayOrder: number;
        isActive: boolean;
    }>): Promise<{
        id: string;
        name: string;
        isActive: boolean;
        createdAt: Date;
        updatedAt: Date;
        serviceId: string;
        slug: string;
        description: string | null;
        displayOrder: number;
        deletedAt: Date | null;
        price: import("@prisma/client/runtime/library").Decimal;
        originalPrice: import("@prisma/client/runtime/library").Decimal | null;
        durationDays: number;
    }>;
    softDeletePlan(id: string): Promise<void>;
    private invalidateCache;
}
