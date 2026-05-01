import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AutomationService } from '../automation/automation.service';
import { NotificationService } from '../notification/notification.service';
import { CouponsService } from '../coupons/coupons.service';
import { CashfreeAdapter } from '../payments/cashfree.adapter';
export declare class OrdersService {
    private readonly prisma;
    private readonly config;
    private readonly automation;
    private readonly notification;
    private readonly coupons;
    private readonly cashfree;
    private readonly logger;
    private razorpay;
    constructor(prisma: PrismaService, config: ConfigService, automation: AutomationService, notification: NotificationService, coupons: CouponsService, cashfree: CashfreeAdapter);
    createOrder(data: {
        customerName: string;
        customerEmail: string;
        customerPhone: string;
        planId: string;
        customerId?: string | null;
        couponCode?: string;
        gateway?: 'razorpay' | 'cashfree';
        whatsappOptedIn?: boolean;
    }): Promise<{
        razorpayOrderId: any;
        keyId: any;
        orderId: string;
        amount: number;
        currency: string;
    } | {
        cashfreeSessionId: any;
        cashfreeOrderId: any;
        orderId: string;
        amount: number;
        currency: string;
    }>;
    verifyPayment(data: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    }): Promise<{
        success: boolean;
        status: string;
        orderId: string;
    }>;
    handleWebhook(rawBody: Buffer, signature: string): Promise<{
        status: string;
    }>;
    handleCashfreeWebhook(rawBody: string, signature: string): Promise<{
        status: string;
    }>;
    getOrderStatus(orderId: string): Promise<{
        service: {
            name: string;
        };
        plan: {
            name: string;
        };
        id: string;
        createdAt: Date;
        paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
        fulfillmentStatus: import(".prisma/client").$Enums.FulfillmentStatus;
        deliveredAt: Date | null;
    }>;
    findAll(filters?: {
        paymentStatus?: string;
        fulfillmentStatus?: string;
        search?: string;
        page?: number;
        limit?: number;
    }): Promise<{
        items: ({
            service: {
                name: string;
            };
            plan: {
                name: string;
            };
        } & {
            id: string;
            createdAt: Date;
            whatsappOptedIn: boolean;
            updatedAt: Date;
            customerId: string | null;
            customerEmail: string;
            customerName: string;
            customerPhone: string;
            amountPaid: import("@prisma/client/runtime/library").Decimal;
            currency: string;
            paymentGateway: string;
            paymentReference: string | null;
            paymentStatus: import(".prisma/client").$Enums.PaymentStatus;
            fulfillmentStatus: import(".prisma/client").$Enums.FulfillmentStatus;
            inventoryId: string | null;
            deliveredAt: Date | null;
            discountAmount: import("@prisma/client/runtime/library").Decimal | null;
            finalAmount: import("@prisma/client/runtime/library").Decimal | null;
            serviceId: string;
            planId: string;
            couponId: string | null;
        })[];
        total: number;
        page: number;
        limit: number;
    }>;
    manualFulfill(orderId: string, content: string): Promise<{
        status: string;
    }>;
    deleteOrder(orderId: string): Promise<{
        deleted: boolean;
    }>;
}
