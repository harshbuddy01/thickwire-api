import {
    Injectable,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationService } from '../automation/automation.service';
import { NotificationService } from '../notification/notification.service';
import { CouponsService } from '../coupons/coupons.service';
import { CashfreeAdapter } from '../payments/cashfree.adapter';
import { createHmac } from 'crypto';

@Injectable()
export class OrdersService {
    private readonly logger = new Logger(OrdersService.name);
    private razorpay: any;

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
        private readonly automation: AutomationService,
        private readonly notification: NotificationService,
        private readonly coupons: CouponsService,
        private readonly cashfree: CashfreeAdapter,
    ) {
        // Lazy-init Razorpay to avoid import issues in test
        const Razorpay = require('razorpay');
        this.razorpay = new Razorpay({
            key_id: this.config.get('RAZORPAY_KEY_ID', 'placeholder_id'),
            key_secret: this.config.get('RAZORPAY_KEY_SECRET', 'placeholder_secret'),
        });
    }

    // ─── Create Order ─────────────────────────────────────

    // Helper to check if a service is manual-delivery
    private isManualService(slug: string, price: number): boolean {
        if (slug === 'spotify' && price <= 100) return true;  // Spotify Outside India
        if (slug === 'youtube') return true;                   // All YouTube plans
        if (slug === 'sonyliv') return true;
        if (slug === 'zee5') return true;
        return false;
    }

    async createOrder(data: {
        customerName: string;
        customerEmail: string;
        customerPhone: string;
        planId: string;
        customerId?: string | null;
        couponCode?: string;
        gateway?: 'razorpay' | 'cashfree';
        whatsappOptedIn?: boolean;
        serviceCredentials?: Record<string, any>;
    }) {
        const plan = await this.prisma.plan.findUnique({
            where: { id: data.planId },
            include: { service: true },
        });
        if (!plan || !plan.isActive) {
            throw new BadRequestException('Plan not found or inactive');
        }

        // Check stock only for auto-delivery services
        const isManual = this.isManualService(plan.service.slug, Number(plan.price));
        if (!isManual) {
            const stockCount = await this.prisma.inventory.count({
                where: { planId: plan.id, isUsed: false },
            });
            if (stockCount === 0) {
                throw new BadRequestException('Out of stock');
            }
        }

        // Base price
        let finalAmount = Number(plan.price);
        let discountAmount = 0;
        let couponId: string | null = null;

        // Validate and apply coupon if present
        if (data.couponCode) {
            const validation = await this.coupons.validateCoupon(
                data.couponCode,
                plan.id,
                finalAmount // orderAmount
            );
            finalAmount = validation.finalAmount;
            discountAmount = validation.discountAmount;
            couponId = validation.couponId;
        }

        const amountInPaise = Math.round(finalAmount * 100);

        if (amountInPaise < 100) {
            throw new BadRequestException('Order amount must be at least ₹1 after discounts');
        }

        let rzpOrder: any = null;
        let cfOrder: any = null;
        const gateway = data.gateway || 'razorpay';
        const referencePrefix = gateway === 'razorpay' ? 'rcpt_' : 'order_';
        const orderTempId = `${referencePrefix}${Date.now()}`;

        if (gateway === 'razorpay') {
            // Create Razorpay order
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
        } else {
            // Create Cashfree session
            cfOrder = await this.cashfree.createOrder(orderTempId, finalAmount, 'INR', {
                name: data.customerName,
                email: data.customerEmail,
                phone: data.customerPhone,
            });
            if (!cfOrder) {
                throw new BadRequestException('Failed to initialize Cashfree gateway');
            }
        }

        // Create our order record
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
                fulfillmentStatus: isManual ? 'MANUAL_PENDING' : 'PENDING',
                serviceCredentials: data.serviceCredentials || undefined,
                whatsappOptedIn: data.whatsappOptedIn || false,
            },
        });

        // Record coupon usage if applied
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

            // Gateway specific payload
            ...(gateway === 'razorpay' ? {
                razorpayOrderId: rzpOrder.id,
                keyId: this.config.get('RAZORPAY_KEY_ID'),
            } : {
                cashfreeSessionId: cfOrder.paymentSessionId,
                cashfreeOrderId: cfOrder.cfOrderId,
            })
        };
    }

    // ─── Verify Frontend Payment ──────────────────────────
    async verifyPayment(data: { razorpay_order_id: string, razorpay_payment_id: string, razorpay_signature: string }) {
        const secret = this.config.get('RAZORPAY_KEY_SECRET');
        if (!secret) throw new BadRequestException('Razorpay secret not configured');

        const generated_signature = createHmac('sha256', secret)
            .update(data.razorpay_order_id + '|' + data.razorpay_payment_id)
            .digest('hex');

        if (generated_signature !== data.razorpay_signature) {
            throw new BadRequestException('Signature mismatch');
        }

        const order = await this.prisma.order.findUnique({
            where: { paymentReference: data.razorpay_order_id },
            include: { service: true, plan: true },
        });
        if (!order) throw new BadRequestException('Order not found');

        if (order.paymentStatus === 'CONFIRMED') {
            return { success: true, status: 'already_processed', orderId: order.id };
        }

        // Mark as paid
        await this.prisma.order.update({
            where: { id: order.id },
            data: { paymentStatus: 'CONFIRMED' },
        });

        // Check if this is a manual-delivery service
        const isManual = this.isManualService(order.service.slug, Number(order.plan.price));

        if (isManual) {
            // Manual service — don't auto-deliver, alert admin instead
            await this.prisma.order.update({
                where: { id: order.id },
                data: { fulfillmentStatus: 'MANUAL_PENDING' },
            });
            await this.notification.sendCredentialSubmission(order);
        } else {
            // Auto-delivery service
            const result = await this.automation.assignInventory(order.id, order.planId);
            if (result) {
                await this.notification.sendOrderDelivered(order, result.content);
            } else {
                await this.prisma.order.update({
                    where: { id: order.id },
                    data: { fulfillmentStatus: 'MANUAL_PENDING' },
                });
                await this.notification.sendOutOfStock(order);
            }
        }

        return { success: true, status: 'processed', orderId: order.id };
    }

    // ─── Webhook ──────────────────────────────────────────

    async handleWebhook(rawBody: Buffer, signature: string) {
        // HMAC verification
        const secret = this.config.get('RAZORPAY_WEBHOOK_SECRET', 'placeholder');
        const expected = createHmac('sha256', secret)
            .update(rawBody)
            .digest('hex');

        if (expected !== signature) {
            this.logger.warn('Webhook signature mismatch');
            throw new BadRequestException('Invalid signature');
        }

        const event = JSON.parse(rawBody.toString());
        this.logger.log(`Webhook received: ${event.event}`);

        if (event.event === 'payment.captured') {
            const payment = event.payload.payment.entity;
            const rzpOrderId = payment.order_id;

            // Idempotency: skip if already confirmed
            const order = await this.prisma.order.findUnique({
                where: { paymentReference: rzpOrderId },
                include: { service: true, plan: true },
            });
            if (!order || order.paymentStatus === 'CONFIRMED') {
                return { status: 'already_processed' };
            }

            // Update payment status
            await this.prisma.order.update({
                where: { id: order.id },
                data: { paymentStatus: 'CONFIRMED' },
            });

            const isManual = this.isManualService(order.service.slug, Number(order.plan.price));

            if (isManual) {
                await this.prisma.order.update({
                    where: { id: order.id },
                    data: { fulfillmentStatus: 'MANUAL_PENDING' },
                });
                await this.notification.sendCredentialSubmission(order);
            } else {
                const result = await this.automation.assignInventory(order.id, order.planId);
                if (result) {
                    await this.notification.sendOrderDelivered(order, result.content);
                } else {
                    await this.prisma.order.update({
                        where: { id: order.id },
                        data: { fulfillmentStatus: 'MANUAL_PENDING' },
                    });
                    await this.notification.sendOutOfStock(order);
                }
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

    async handleCashfreeWebhook(rawBody: string, signature: string) {
        if (!this.cashfree.verifyWebhook(rawBody, signature)) {
            this.logger.warn('Cashfree webhook signature mismatch');
            throw new BadRequestException('Invalid signature');
        }

        const event = JSON.parse(rawBody);
        this.logger.log(`Cashfree webhook received: ${event.type}`);

        if (event.type === 'PAYMENT_SUCCESS_WEBHOOK') {
            const cfOrderId = event.data.order.order_id; // This matches what CF sends back

            const order = await this.prisma.order.findUnique({
                where: { paymentReference: cfOrderId },
                include: { service: true, plan: true },
            });

            if (!order || order.paymentStatus === 'CONFIRMED') {
                return { status: 'already_processed' };
            }

            await this.prisma.order.update({
                where: { id: order.id },
                data: { paymentStatus: 'CONFIRMED' },
            });

            const isManual = this.isManualService(order.service.slug, Number(order.plan.price));

            if (isManual) {
                await this.prisma.order.update({
                    where: { id: order.id },
                    data: { fulfillmentStatus: 'MANUAL_PENDING' },
                });
                await this.notification.sendCredentialSubmission(order);
            } else {
                const result = await this.automation.assignInventory(order.id, order.planId);
                if (result) {
                    await this.notification.sendOrderDelivered(order, result.content);
                } else {
                    await this.prisma.order.update({
                        where: { id: order.id },
                        data: { fulfillmentStatus: 'MANUAL_PENDING' },
                    });
                    await this.notification.sendOutOfStock(order);
                }
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

    // ─── Status Polling ───────────────────────────────────

    async getOrderStatus(orderId: string) {
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
        if (!order) throw new BadRequestException('Order not found');
        return order;
    }

    // ─── Admin ────────────────────────────────────────────

    async findAll(filters?: {
        paymentStatus?: string;
        fulfillmentStatus?: string;
        search?: string;
        page?: number;
        limit?: number;
    }) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 25;
        const skip = (page - 1) * limit;
        const where: any = {};

        if (filters?.paymentStatus) where.paymentStatus = filters.paymentStatus;
        if (filters?.fulfillmentStatus) where.fulfillmentStatus = filters.fulfillmentStatus;
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

    async manualFulfill(orderId: string, content: string) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order) throw new BadRequestException('Order not found');

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

    async deleteOrder(orderId: string) {
        const order = await this.prisma.order.findUnique({ where: { id: orderId } });
        if (!order) throw new BadRequestException('Order not found');

        // Only allow deleting failed/expired/pending orders — not paid confirmed ones
        if (order.paymentStatus === 'CONFIRMED') {
            throw new BadRequestException('Cannot delete a confirmed/paid order');
        }

        await this.prisma.order.delete({ where: { id: orderId } });
        return { deleted: true };
    }

    // ─── Service Credentials (Admin) ─────────────────────

    async getServiceCredentialOrders(filters?: { service?: string; page?: number; limit?: number }) {
        const page = filters?.page || 1;
        const limit = filters?.limit || 25;
        const skip = (page - 1) * limit;
        const where: any = {
            serviceCredentials: { not: null as any },
            paymentStatus: 'CONFIRMED',
        };

        if (filters?.service) {
            where.service = { slug: filters.service };
        }

        const [items, total] = await Promise.all([
            this.prisma.order.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
                include: {
                    service: { select: { name: true, slug: true } },
                    plan: { select: { name: true } },
                },
            }),
            this.prisma.order.count({ where }),
        ]);

        return { items, total, page, limit };
    }

    async sendActivationLink(orderId: string, link: string) {
        const order = await this.prisma.order.findUnique({
            where: { id: orderId },
            include: { service: true, plan: true },
        });
        if (!order) throw new BadRequestException('Order not found');

        // Send activation link via notification service
        await this.notification.sendActivationLink(order, link);

        // Mark as fulfilled
        await this.prisma.order.update({
            where: { id: orderId },
            data: {
                fulfillmentStatus: 'MANUAL_FULFILLED',
                deliveredAt: new Date(),
            },
        });

        return { status: 'link_sent' };
    }
}
