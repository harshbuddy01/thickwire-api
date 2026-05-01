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
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
let PrismaService = class PrismaService {
    constructor() {
        this._client = new client_1.PrismaClient();
    }
    async onModuleInit() {
        await this._client.$connect();
    }
    async onModuleDestroy() {
        await this._client.$disconnect();
    }
    get service() { return this._client.service; }
    get plan() { return this._client.plan; }
    get inventory() { return this._client.inventory; }
    get order() { return this._client.order; }
    get admin() { return this._client.admin; }
    get auditLog() { return this._client.auditLog; }
    get supportTicket() { return this._client.supportTicket; }
    get ticketMessage() { return this._client.ticketMessage; }
    get notificationLog() { return this._client.notificationLog; }
    get coupon() { return this._client.coupon; }
    get customerAccount() { return this._client.customerAccount; }
    get customerSession() { return this._client.customerSession; }
    get subscriptionExpiry() { return this._client.subscriptionExpiry; }
    get couponUsage() { return this._client.couponUsage; }
    $queryRaw(...args) {
        return this._client.$queryRaw(...args);
    }
    $transaction(fn) {
        return this._client.$transaction(fn);
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map