import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class ServicesService {
    private readonly logger = new Logger(ServicesService.name);
    private readonly CACHE_TTL = 60; // seconds

    constructor(
        private readonly prisma: PrismaService,
        private readonly redis: RedisService,
    ) { }

    // ─── Public ───────────────────────────────────────────

    async findAllActive() {
        const cacheKey = 'services:active';
        const cached = await this.redis.getJson<any[]>(cacheKey);
        if (cached) return cached;

        const services = await this.prisma.service.findMany({
            where: { isActive: true, deletedAt: null },
            orderBy: { displayOrder: 'asc' },
            include: {
                plans: {
                    where: { isActive: true, deletedAt: null },
                    orderBy: { displayOrder: 'asc' },
                    include: {
                        inventory: { where: { isUsed: false }, select: { id: true } },
                    },
                },
            },
        });

        // Map to include stock count
        const result = services.map((s) => ({
            ...s,
            plans: s.plans.map((p) => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                description: p.description,
                price: p.price,
                originalPrice: p.originalPrice,
                durationDays: p.durationDays,
                displayOrder: p.displayOrder,
                stockCount: p.inventory.length,
                inStock: p.inventory.length > 0,
            })),
        }));

        await this.redis.setJson(cacheKey, result, this.CACHE_TTL);
        return result;
    }

    async findBySlug(slug: string) {
        const cacheKey = `services:slug:${slug}`;
        const cached = await this.redis.getJson<any>(cacheKey);
        if (cached) return cached;

        const service = await this.prisma.service.findUnique({
            where: { slug },
            include: {
                plans: {
                    where: { isActive: true, deletedAt: null },
                    orderBy: { displayOrder: 'asc' },
                    include: {
                        inventory: { where: { isUsed: false }, select: { id: true } },
                    },
                },
            },
        });

        if (!service || !service.isActive || service.deletedAt) return null;

        const result = {
            ...service,
            plans: service.plans.map((p) => ({
                id: p.id,
                name: p.name,
                slug: p.slug,
                description: p.description,
                price: p.price,
                originalPrice: p.originalPrice,
                durationDays: p.durationDays,
                displayOrder: p.displayOrder,
                stockCount: p.inventory.length,
                inStock: p.inventory.length > 0,
            })),
        };

        await this.redis.setJson(cacheKey, result, 30);
        return result;
    }

    // ─── Admin CRUD ───────────────────────────────────────

    async findAll() {
        return this.prisma.service.findMany({
            where: { deletedAt: null },
            orderBy: { displayOrder: 'asc' },
            include: { _count: { select: { plans: true, orders: true } } },
        });
    }

    async create(data: { name: string; slug: string; logoUrl?: string; description?: string; displayOrder?: number }) {
        const service = await this.prisma.service.create({ data });
        await this.invalidateCache();
        return service;
    }

    async update(id: string, data: Partial<{ name: string; slug: string; logoUrl: string; description: string; displayOrder: number; isActive: boolean }>) {
        const service = await this.prisma.service.update({ where: { id }, data });
        await this.invalidateCache();
        return service;
    }

    async softDelete(id: string) {
        await this.prisma.service.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
        await this.invalidateCache();
    }

    // ─── Plans CRUD ───────────────────────────────────────

    async findPlans(serviceId: string) {
        return this.prisma.plan.findMany({
            where: { serviceId, deletedAt: null },
            orderBy: { displayOrder: 'asc' },
            include: {
                _count: { select: { inventory: { where: { isUsed: false } } } },
            },
        });
    }

    async createPlan(data: {
        serviceId: string; name: string; slug: string; description?: string;
        price: number; originalPrice?: number; durationDays: number; displayOrder?: number;
    }) {
        const plan = await this.prisma.plan.create({ data: data as any });
        await this.invalidateCache();
        return plan;
    }

    async updatePlan(id: string, data: Partial<{
        name: string; slug: string; description: string;
        price: number; originalPrice: number; durationDays: number;
        displayOrder: number; isActive: boolean;
    }>) {
        const plan = await this.prisma.plan.update({ where: { id }, data: data as any });
        await this.invalidateCache();
        return plan;
    }

    async softDeletePlan(id: string) {
        await this.prisma.plan.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
        await this.invalidateCache();
    }

    private async invalidateCache() {
        await this.redis.delByPattern('services:*');
    }
}
