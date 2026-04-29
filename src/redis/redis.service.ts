import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy, OnModuleInit {
    private readonly client: Redis;
    private readonly logger = new Logger(RedisService.name);
    private isConnected = false;

    constructor(private readonly configService: ConfigService) {
        const redisUrl = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
        this.client = new Redis(redisUrl, {
            lazyConnect: true,
            retryStrategy(times) {
                if (times > 5) {
                    return null; // Stop retrying after 5 attempts
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
        } catch (err) {
            this.logger.warn(`Redis unavailable — running without cache: ${(err as Error).message}`);
        }
    }

    async onModuleDestroy() {
        try {
            await this.client.quit();
        } catch {
            // Already disconnected
        }
    }

    async get(key: string): Promise<string | null> {
        if (!this.isConnected) return null;
        try {
            return await this.client.get(key);
        } catch {
            return null;
        }
    }

    async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
        if (!this.isConnected) return;
        try {
            if (ttlSeconds) {
                await this.client.set(key, value, 'EX', ttlSeconds);
            } else {
                await this.client.set(key, value);
            }
        } catch {
            // Silently fail — cache is optional
        }
    }

    async del(key: string): Promise<void> {
        if (!this.isConnected) return;
        try {
            await this.client.del(key);
        } catch {
            // Silently fail
        }
    }

    async delByPattern(pattern: string): Promise<void> {
        if (!this.isConnected) return;
        try {
            const keys = await this.client.keys(pattern);
            if (keys.length > 0) {
                await this.client.del(...keys);
            }
        } catch {
            // Silently fail
        }
    }

    async getJson<T>(key: string): Promise<T | null> {
        const val = await this.get(key);
        if (!val) return null;
        try {
            return JSON.parse(val) as T;
        } catch {
            return null;
        }
    }

    async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
        await this.set(key, JSON.stringify(value), ttlSeconds);
    }
}

