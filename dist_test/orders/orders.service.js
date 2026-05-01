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
var OrdersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrdersService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const automation_service_1 = require("../automation/automation.service");
const notification_service_1 = require("../notification/notification.service");
const coupons_service_1 = require("../coupons/coupons.service");
const cashfree_adapter_1 = require("../payments/cashfree.adapter");
const crypto_1 = require("crypto");
let OrdersService = OrdersService_1 = class OrdersService {
    constructor(prisma, config, automation, notification, coupons, cashfree) {
        this.prisma = prisma;
        this.config = config;
        this.automation = automation;
        this.notification = notification;
        this.coupons = coupons;
        this.cashfree = cashfree;
        this.logger = new common_1.Logger(OrdersService_1.name);
        const Razorpay = require('razorpay');
        this.razorpay = new Razorpay({
            key_id: this.config.get('RAZORPAY_KEY_ID', 'placeholder_id'),
            key_secret: this.config.get('RAZORPAY_KEY_SECRET', 'placeholder_secret'),
        });
    }
    async createOrder(data) {
        const plan = await this.prisma.plan.findUnique({
            where: { id: data.planId },
            include: { service: true },
        });
        if (!plan || !plan.isActive) {
            throw new common_1.BadRequestException('Plan not found or inactive');
        }
        const stockCount = await this.prisma.inventory.count({
            where: { planId: plan.id, isUsed: false },
        });
        if (stockCount === 0) {
            throw new common_1.BadRequestException('Out of stock');
        }
        let finalAmount = Number(plan.price);
        let discountAmount = 0;
        let couponId = null;
        if (data.couponCode) {
            const validation = await this.coupons.validateCoupon(data.couponCode, plan.id, finalAmount);
            finalAmount = validation.finalAmount;
            discountAmount = validation.discountAmount;
            couponId = validation.couponId;
        }
        const amountInPaise = Math.round(finalAmount * 100);
        if (amountInPaise < 100) {
            throw new common_1.BadRequestException('Order amount must be at least ₹1 after discounts');
        }
        let rzpOrder = null;
        let cfOrder = null;
        const gateway = data.gateway || 'razorpay';
        const referencePrefix = gateway === 'razorpay' ? 'rcpt_' : 'order_';
        const orderTempId = `${referencePrefix}${Date.now()}`;
        if (gateway === 'razorpay') {
            rzpOrder = await this.razorpay.orders.create({
                amount: amountInPaise,
                currency: 'INR',
                receipt: orderTempId,
                notes: {
                    planId: plan.id,
                    serviceId: plan.serviceId,
                    customerEmail: data.customerEmail,
                },
            });
        }
        else {
            cfOrder = await this.cashfree.createOrder(orderTempId, finalAmount, 'INR', {
                name: data.customerName,
                email: data.customerEmail,
                phone: data.customerPhone,
            });
            if (!cfOrder) {
                throw new common_1.BadRequestException('Failed to initialize Cashfree gateway');
            }
        }
        const order = await this.prisma.order.create({
            data: {
                customerName: data.customerName,
                customerEmail: data.customerEmail,
                customerPhone: data.customerPhone,
                customerId: data.customerId || null,
                serviceId: plan.serviceId,
                planId: plan.id,
                amountPaid: finalAmount.toString(),
                discountAmount: discountAmount > 0 ? discountAmount.toString() : null,
                couponId,
                paymentReference: gateway === 'razorpay' ? rzpOrder.id : cfOrder.cfOrderId,
                paymentStatus: 'PENDING',
                fulfillmentStatus: 'PENDING',
                whatsappOptedIn: data.whatsappOptedIn || false,
            },
        });
        if (couponId) {
            await this.prisma.couponUsage.create({
                data: {
                    couponId,
                    orderId: order.id,
                }
            });
            await this.prisma.coupon.update({
                where: { id: couponId },
                data: { usedCount: { increment: 1 } }
            });
        }
        return {
            orderId: order.id,
            amount: finalAmount,
            currency: 'INR',
            ...(gateway === 'razorpay' ? {
                razorpayOrderId: rzpOrder.id,
                keyId: this.config.get('RAZORPAY_KEY_ID'),
            } : {
                cashfreeSessionId: cfOrder.paymentSessionId,
                cashfreeOrderId: cfOrder.cfOrderId,
            })
        };
    }
    async verifyPayment(data) {
        const secret = this.config.get('RAZORPAY_KEY_SECRET');
        if (!secret)
            throw new common_1.BadRequestException('Razorpay secret not configured');
        const generated_signature = (0, crypto_1.createHmac)('sha256', secret)
            .update(data.razorpay_order_id + '|' + data.razorpay_payment_id)
            .digest('hex');
        if (generated_signature !== data.razorpay_signature) {
            throw new common_1.BadRequestException('Signature mismatch');
        }
        const order = await this.prisma.order.findUnique({
            where: { paymentReference: data.razorpay_order_id },
        });
        if (!order)
            throw new common_1.BadRequestException('Order not found');
        if (order.paymentStatus === 'CONFIRMED') {
            return { success: true, status: 'already_processed', orderId: order.id };
        }
        await this.prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'CONFIRMED' },
        });
        const result = await this.automation.assignInventory(order.id, order.planId);
        if (result) {
            await this.notification.sendOrderDelivered(order, result.content);
        }
        else {
            await this.prisma.order.update({
                where: { id: order.id },
                data: { fulfillmentStatus: 'MANUAL_PENDING' },
            });
            await this.notification.sendOutOfStock(order);
        }
        return { success: true, status: 'processed', orderId: order.id };
    }
    async handleWebhook(rawBody, signature) {
        const secret = this.config.get('RAZORPAY_WEBHOOK_SECRET', 'placeholder');
        const expected = (0, crypto_1.createHmac)('sha256', secret)
            .update(rawBody)
            .digest('hex');
        if (expected !== signature) {
            this.logger.warn('Webhook signature mismatch');
            throw new common_1.BadRequestException('Invalid signature');
        }
        const event = JSON.parse(rawBody.toString());
        this.logger.log(`Webhook received: ${event.event}`);
        if (event.event === 'payment.captured') {
            const payment = event.payload.payment.entity;
            const rzpOrderId = payment.order_id;
            const order = await this.prisma.order.findUnique({
                where: { paymentReference: rzpOrderId },
            });
            if (!order || order.paymentStatus === 'CONFIRMED') {
                return { status: 'already_processed' };
            }
            await this.prisma.order.update({
                where: { id: order.id },
                data: { paymentStatus: 'CONFIRMED' },
            });
            const result = await this.automation.assignInventory(order.id, order.planId);
            if (result) {
                await this.notification.sendOrderDelivered(order, result.content);
            }
            else {
                await this.prisma.order.update({
                    where: { id: order.id },
                    data: { fulfillmentStatus: 'MANUAL_PENDING' },
                });
                await this.notification.sendOutOfStock(order);
            }
            return { status: 'processed' };
        }
        if (event.event === 'payment.failed') {
            const payment = event.payload.payment.entity;
            const rzpOrderId = payment.order_id;
            await this.prisma.order.updateMany({
                where: { paymentReference: rzpOrderId },
                data: { paymentStatus: 'FAILED' },
            });
            return { status: 'failed_recorded' };
        }
        return { status: 'ignored' };
    }
    async handleCashfreeWebhook(rawBody, signature) {
        if (!this.cashfree.verifyWebhook(rawBody, signature)) {
            this.logger.warn('Cashfree webhook signature mismatch');
            throw new common_1.BadRequestException('Invalid signature');
        }
        const event = JSON.parse(rawBody);
        this.logger.log(`Cashfree webhook received: ${event.type}`);
        if (event.type === 'PAYMENT_SUCCESS_WEBHOOK') {
            const cfOrderId = event.data.order.order_id;
            const order = await this.prisma.order.findUnique({
                where: { paymentReference: cfOrderId },
            });
            if (!order || order.paymentStatus === 'CONFIRMED') {
                return { status: 'already_processed' };
            }
            await this.prisma.order.update({
                where: { id: order.id },
                data: { paymentStatus: 'CONFIRMED' },
            });
            const result = await this.automation.assignInventory(order.id, order.planId);
            if (result) {
                await this.notification.sendOrderDelivered(order, result.content);
            }
            else {
                await this.prisma.order.update({
                    where: { id: order.id },
                    data: { fulfillmentStatus: 'MANUAL_PENDING' },
                });
                await this.notification.sendOutOfStock(order);
            }
            return { status: 'processed' };
        }
        if (event.type === 'PAYMENT_FAILED_WEBHOOK') {
            const cfOrderId = event.data.order.order_id;
            await this.prisma.order.updateMany({
                where: { paymentReference: cfOrderId },
                data: { paymentStatus: 'FAILED' },
            });
            return { status: 'failed_recorded' };
        }
        return { status: 'ignored' };
    }
    async getOrderStatus(orderId) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            select: {
                id: true,
                paymentStatus: true,
                fulfillmentStatus: true,
                deliveredAt: true,
                createdAt: true,
                service: { select: { name: true } },
                plan: { select: { name: true } },
            },
        });
        if (!order)
            throw new common_1.BadRequestException('Order not found');
        return order;
    }
    async findAll(filters) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 25;
        const skip = (page - 1) * limit;
        const where = {};
        if (filters?.paymentStatus)
            where.paymentStatus = filters.paymentStatus;
        if (filters?.fulfillmentStatus)
            where.fulfillmentStatus = filters.fulfillmentStatus;
        if (filters?.search) {
            where.OR = [
                { customerEmail: { contains: filters.search, mode: 'insensitive' } },
                { customerName: { contains: filters.search, mode: 'insensitive' } },
                { id: { contains: filters.search } },
            ];
        }
        const [items, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    service: { select: { name: true } },
                    plan: { select: { name: true } },
                },
            }),
            this.prisma.order.count({ where }),
        ]);
        return { items, total, page, limit };
    }
    async manualFulfill(orderId, content) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order)
            throw new common_1.BadRequestException('Order not found');
        await this.prisma.order.update({
            where: { id: orderId },
            data: {
                fulfillmentStatus: 'MANUAL_FULFILLED',
                deliveredAt: new Date(),
            },
        });
        await this.notification.sendOrderDelivered(order, content);
        return { status: 'fulfilled' };
    }
    async deleteOrder(orderId) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order)
            throw new common_1.BadRequestException('Order not found');
        if (order.paymentStatus === 'CONFIRMED') {
            throw new common_1.BadRequestException('Cannot delete a confirmed/paid order');
        }
        await this.prisma.order.delete({ where: { id: orderId } });
        return { deleted: true };
    }
};
exports.OrdersService = OrdersService;
exports.OrdersService = OrdersService = OrdersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService,
        automation_service_1.AutomationService,
        notification_service_1.NotificationService,
        coupons_service_1.CouponsService,
        cashfree_adapter_1.CashfreeAdapter])
], OrdersService);
//# sourceMappingURL=orders.service.js.map