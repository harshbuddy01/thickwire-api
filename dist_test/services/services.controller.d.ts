import { ServicesService } from './services.service';
export declare class ServicesController {
    private readonly servicesService;
    constructor(servicesService: ServicesService);
    findAll(): Promise<any[]>;
    findBySlug(slug: string): Promise<any>;
    adminFindAll(): Promise<({
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
    create(body: {
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
    update(id: string, body: any): Promise<{
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
    softDelete(id: string): Promise<{
        message: string;
    }>;
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
    createPlan(serviceId: string, body: {
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
    updatePlan(id: string, body: any): Promise<{
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
    softDeletePlan(id: string): Promise<{
        message: string;
    }>;
}
