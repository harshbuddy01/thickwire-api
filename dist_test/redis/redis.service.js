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
var RedisService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = require("ioredis");
let RedisService = RedisService_1 = class RedisService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(RedisService_1.name);
        this.isConnected = false;
        const redisUrl = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
        this.client = new ioredis_1.default(redisUrl, {
            lazyConnect: true,
            retryStrategy(times) {
                if (times > 5) {
                    return null;
                }
                return Math.min(times * 500, 2000);
            },
            maxRetriesPerRequest: 3,
            enableOfflineQueue: false,
        });
        this.client.on('connect', () => {
            this.isConnected = true;
            this.logger.log('Redis connected');
        });
        this.client.on('error', (err) => {
            this.isConnected = false;
            this.logger.warn(`Redis error: ${err.message}`);
        });
        this.client.on('close', () => {
            this.isConnected = false;
        });
    }
    async onModuleInit() {
        try {
            await this.client.connect();
        }
        catch (err) {
            this.logger.warn(`Redis unavailable — running without cache: ${err.message}`);
        }
    }
    async onModuleDestroy() {
        try {
            await this.client.quit();
        }
        catch {
        }
    }
    async get(key) {
        if (!this.isConnected)
            return null;
        try {
            return await this.client.get(key);
        }
        catch {
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        if (!this.isConnected)
            return;
        try {
            if (ttlSeconds) {
                await this.client.set(key, value, 'EX', ttlSeconds);
            }
            else {
                await this.client.set(key, value);
            }
        }
        catch {
        }
    }
    async del(key) {
        if (!this.isConnected)
            return;
        try {
            await this.client.del(key);
        }
        catch {
        }
    }
    async delByPattern(pattern) {
        if (!this.isConnected)
            return;
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
        }
        catch {
        }
    }
    async getJson(key) {
        const val = await this.get(key);
        if (!val)
            return null;
        try {
            return JSON.parse(val);
        }
        catch {
            return null;
        }
    }
    async setJson(key, value, ttlSeconds) {
        await this.set(key, JSON.stringify(value), ttlSeconds);
    }
};
exports.RedisService = RedisService;
exports.RedisService = RedisService = RedisService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisService);
//# sourceMappingURL=redis.service.js.map