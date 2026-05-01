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
var ServicesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServicesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const redis_service_1 = require("../redis/redis.service");
let ServicesService = ServicesService_1 = class ServicesService {
    constructor(prisma, redis) {
        this.prisma = prisma;
        this.redis = redis;
        this.logger = new common_1.Logger(ServicesService_1.name);
        this.CACHE_TTL = 60;
    }
    async findAllActive() {
        const cacheKey = 'services:active';
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
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
    async findBySlug(slug) {
        const cacheKey = `services:slug:${slug}`;
        const cached = await this.redis.getJson(cacheKey);
        if (cached)
            return cached;
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
        if (!service || !service.isActive || service.deletedAt)
            return null;
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
    async findAll() {
        return this.prisma.service.findMany({
            where: { deletedAt: null },
            orderBy: { displayOrder: 'asc' },
            include: { _count: { select: { plans: true, orders: true } } },
        });
    }
    async create(data) {
        const service = await this.prisma.service.create({ data });
        await this.invalidateCache();
        return service;
    }
    async update(id, data) {
        const service = await this.prisma.service.update({ where: { id }, data });
        await this.invalidateCache();
        return service;
    }
    async softDelete(id) {
        await this.prisma.service.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
        await this.invalidateCache();
    }
    async findPlans(serviceId) {
        return this.prisma.plan.findMany({
            where: { serviceId, deletedAt: null },
            orderBy: { displayOrder: 'asc' },
            include: {
                _count: { select: { inventory: { where: { isUsed: false } } } },
            },
        });
    }
    async createPlan(data) {
        const plan = await this.prisma.plan.create({ data: data });
        await this.invalidateCache();
        return plan;
    }
    async updatePlan(id, data) {
        const plan = await this.prisma.plan.update({ where: { id }, data: data });
        await this.invalidateCache();
        return plan;
    }
    async softDeletePlan(id) {
        await this.prisma.plan.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
        await this.invalidateCache();
    }
    async invalidateCache() {
        await this.redis.delByPattern('services:*');
    }
};
exports.ServicesService = ServicesService;
exports.ServicesService = ServicesService = ServicesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        redis_service_1.RedisService])
], ServicesService);
//# sourceMappingURL=services.service.js.map