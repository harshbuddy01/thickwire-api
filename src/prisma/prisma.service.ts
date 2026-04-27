import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
    private _client: PrismaClient;

    constructor() {
        this._client = new PrismaClient();
    }

    async onModuleInit() {
        await this._client.$connect();
    }

    async onModuleDestroy() {
        await this._client.$disconnect();
    }

    // ─── Model Accessors ──────────────────────────────────
    get service() { return this._client.service; }
    get plan() { return this._client.plan; }
    get inventory() { return this._client.inventory; }
    get order() { return this._client.order; }
    get admin() { return this._client.admin; }
    get auditLog() { return this._client.auditLog; }
    get supportTicket() { return this._client.supportTicket; }
    get notificationLog() { return this._client.notificationLog; }
    get coupon() { return this._client.coupon; }
    get customerAccount() { return this._client.customerAccount; }
    get customerSession() { return this._client.customerSession; }
    get subscriptionExpiry() { return this._client.subscriptionExpiry; }
    get couponUsage() { return this._client.couponUsage; }

    // ─── Prisma Utilities ─────────────────────────────────
    $queryRaw<T = unknown>(...args: Parameters<PrismaClient['$queryRaw']>): ReturnType<PrismaClient['$queryRaw']> {
        return this._client.$queryRaw(...args) as any;
    }

    $transaction<T>(fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
        return this._client.$transaction(fn);
    }
}
