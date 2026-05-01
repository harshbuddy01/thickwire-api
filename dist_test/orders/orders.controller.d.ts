import { RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { OrdersService } from './orders.service';
export declare class OrdersController {
    private readonly ordersService;
    constructor(ordersService: OrdersService);
    createOrder(body: {
        customerName: string;
        customerEmail: string;
        customerPhone: string;
        planId: string;
        couponCode?: string;
        gateway?: 'razorpay' | 'cashfree';
        whatsappOptedIn?: boolean;
    }, req: any): Promise<{
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
    verifyPayment(body: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    }): Promise<{
        success: boolean;
        status: string;
        orderId: string;
    }>;
    webhook(req: RawBodyRequest<Request>, signature: string): Promise<{
        status: string;
    }>;
    webhookCashfree(req: RawBodyRequest<Request>, signature: string): Promise<{
        status: string;
    }>;
    getStatus(id: string): Promise<{
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
    findAll(paymentStatus?: string, fulfillmentStatus?: string, search?: string, page?: number, limit?: number): Promise<{
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
    manualFulfill(id: string, content: string): Promise<{
        status: string;
    }>;
    deleteOrder(id: string): Promise<{
        message: string;
    }>;
}
