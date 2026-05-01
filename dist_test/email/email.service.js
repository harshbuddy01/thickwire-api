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
var EmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let EmailService = EmailService_1 = class EmailService {
    constructor(config) {
        this.config = config;
        this.logger = new common_1.Logger(EmailService_1.name);
        const nodemailer = require('nodemailer');
        this.transporter = nodemailer.createTransport({
            host: this.config.get('SMTP_HOST', 'smtp-relay.brevo.com'),
            port: this.config.get('SMTP_PORT', 587),
            auth: {
                user: this.config.get('SMTP_USER', 'a971a9001@smtp-brevo.com'),
                pass: this.config.get('SMTP_PASS', 'sMYSFpvKtVh2BI71'),
            },
        });
        const baseOrdersEmail = this.config.get('SMTP_ORDERS_EMAIL', 'orders@streamkart.store');
        const baseSupportEmail = this.config.get('SMTP_SUPPORT_EMAIL', 'support@streamkart.store');
        this.ordersEmail = `ThickWire <${baseOrdersEmail}>`;
        this.supportEmail = `ThickWire Support <${baseSupportEmail}>`;
        this.fromEmail = baseOrdersEmail;
    }
    async sendOrderConfirmation(to, data) {
        return this.send(to, 'Order Confirmed — ThickWire', this.tplOrderConfirmation(data), { from: this.ordersEmail, replyTo: 'support@streamkart.store' });
    }
    async sendDelivery(to, data) {
        return this.send(to, 'Your Order is Ready — ThickWire', this.tplDelivery(data), { from: this.ordersEmail, replyTo: 'support@streamkart.store' });
    }
    async sendOutOfStock(to, data) {
        return this.send(to, 'Order Under Review — ThickWire', this.tplOutOfStock(data), { from: this.ordersEmail, replyTo: 'support@streamkart.store' });
    }
    async sendSupportAutoReply(to, data) {
        return this.send(to, `Re: ${data.subject} — ThickWire Support`, this.tplSupportAutoReply(data), { from: this.supportEmail, replyTo: 'support@streamkart.store' });
    }
    async sendSupportReply(to, data) {
        return this.send(to, `[Update] Ticket #${data.ticketId.slice(0, 8)}: ${data.subject}`, `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#6366f1">Support Reply</h2>
      <p>Hi ${data.customerName},</p>
      <p>Our team has replied to your support request <strong>#${data.ticketId.slice(0, 8)}</strong>.</p>
      <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;white-space:pre-wrap;">${data.replyText}</div>
      <p>If you have further questions, please reply to this email or open a new ticket.</p>
      <hr/><p style="color:#888;font-size:12px">ThickWire Support</p>
    </div>`, { from: this.supportEmail, replyTo: 'support@streamkart.store' });
    }
    async sendLowStockAlert(to, data) {
        return this.send(to, '⚠️ Low Stock Alert — ThickWire', this.tplLowStock(data), { from: this.ordersEmail });
    }
    async sendAdminNotification(data) {
        const fallbackEmail = this.config.get('SMTP_FROM_EMAIL', 'orders@streamkart.store');
        const adminEmail = this.config.get('ADMIN_NOTIFICATION_EMAIL', fallbackEmail);
        return this.send(adminEmail, data.subject, `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#6366f1">Support Notification</h2>
      <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;white-space:pre-wrap;">${data.body}</div>
      <hr/><p style="color:#888;font-size:12px">ThickWire Admin Alert</p>
    </div>`, { from: this.supportEmail });
    }
    async sendVerification(to, data) {
        return this.send(to, 'Verify your email address — ThickWire', `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#6366f1">Verify Your Email</h2>
      <p>Hi ${data.customerName},</p>
      <p>Thanks for signing up! Click the button below to verify your email address.</p>
      <a href="${data.verifyUrl}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Verify Email</a>
      <p style="color:#888;font-size:13px">If you didn't create an account, you can safely ignore this email.</p>
      <hr/><p style="color:#888;font-size:12px">ThickWire — Digital Marketplace</p>
    </div>`, { from: this.ordersEmail, replyTo: 'support@streamkart.store' });
    }
    async sendWelcome(to, data) {
        return this.send(to, 'Welcome to ThickWire!', `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#22c55e">Welcome aboard! 🎉</h2>
      <p>Hi ${data.customerName},</p>
      <p>Your email has been verified and your account is all set up.</p>
      <p>You can now track your orders, manage subscriptions, and get expiry reminders — all from your account dashboard.</p>
      <a href="${process.env.STOREFRONT_URL || 'http://localhost:3000'}/account" style="display:inline-block;background:#22c55e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Go to My Account</a>
      <hr/><p style="color:#888;font-size:12px">ThickWire — Digital Marketplace</p>
    </div>`, { from: this.ordersEmail, replyTo: 'support@streamkart.store' });
    }
    async sendPasswordReset(to, data) {
        return this.send(to, 'Reset your password — ThickWire', `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#f59e0b">Reset Your Password</h2>
      <p>Hi ${data.customerName},</p>
      <p>We received a request to reset your password. Click below to set a new one:</p>
      <a href="${data.resetUrl}" style="display:inline-block;background:#f59e0b;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Reset Password</a>
      <p style="color:#888;font-size:13px">This link expires in 1 hour. If you didn't request this, your account is safe.</p>
      <hr/><p style="color:#888;font-size:12px">ThickWire — Digital Marketplace</p>
    </div>`, { from: this.ordersEmail, replyTo: 'support@streamkart.store' });
    }
    async sendExpiryReminder(to, data) {
        const urgency = data.daysLeft <= 1 ? { color: '#ef4444', label: 'LAST DAY', subject: `Last day! Your ${data.serviceName} expires tomorrow` }
            : data.daysLeft <= 3 ? { color: '#f59e0b', label: 'URGENT', subject: `Your ${data.serviceName} expires in ${data.daysLeft} days` }
                : { color: '#6366f1', label: 'REMINDER', subject: `Your ${data.serviceName} expires in ${data.daysLeft} days` };
        return this.send(to, `${urgency.subject} — ThickWire`, `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:${urgency.color}">${urgency.label}: Subscription Expiring</h2>
      <p>Hi ${data.customerName},</p>
      <p>Your <strong>${data.serviceName} — ${data.planName}</strong> subscription expires on <strong>${data.expiryDate}</strong> (${data.daysLeft} day${data.daysLeft > 1 ? 's' : ''} remaining).</p>
      <a href="${data.renewUrl}" style="display:inline-block;background:${urgency.color};color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Renew Now</a>
      <p style="color:#888;font-size:13px">Don't lose access — renew before it expires.</p>
      <hr/><p style="color:#888;font-size:12px">ThickWire — Digital Marketplace</p>
    </div>`, { from: this.ordersEmail, replyTo: 'support@streamkart.store' });
    }
    async sendOrderProcessingDelay(to, data) {
        return this.send(to, 'Important Update on Your Order — ThickWire', `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#f59e0b">Order Under Processing ⏳</h2>
      <p>Hi ${data.customerName},</p>
      <p>Your payment for <strong>${data.serviceName} — ${data.planName}</strong> (Order #${data.orderId.slice(0, 8)}) was successful!</p>
      <p>We are currently experiencing a slight delay in automatically delivering your credentials. Our team has been notified and is working to fulfill your order manually as quickly as possible.</p>
      <p>You will receive another email with your credentials very soon.</p>
      <hr/><p style="color:#888;font-size:12px">ThickWire Support</p>
    </div>`, { from: this.ordersEmail, replyTo: 'support@streamkart.store' });
    }
    async send(to, subject, html, options) {
        try {
            await this.transporter.sendMail({
                from: options?.from || this.fromEmail,
                replyTo: options?.replyTo,
                to,
                subject,
                html,
            });
            this.logger.log(`Email sent to ${to}: ${subject}`);
            return true;
        }
        catch (err) {
            this.logger.error(`Email failed to ${to}: ${err.message}`);
            return false;
        }
    }
    tplOrderConfirmation(d) {
        return `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#6366f1">Order Confirmed ✅</h2>
      <p>Hi ${d.customerName},</p>
      <p>Your order <strong>#${d.orderId.slice(0, 8)}</strong> for <strong>${d.serviceName} — ${d.planName}</strong> has been confirmed.</p>
      <p>Amount: ₹${d.amount}</p>
      <p>We're processing your order and will deliver it shortly.</p>
      <hr/><p style="color:#888;font-size:12px">ThickWire — Digital Marketplace</p>
    </div>`;
    }
    tplDelivery(d) {
        return `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#22c55e">Order Delivered 🎉</h2>
      <p>Hi ${d.customerName},</p>
      <p>Your order <strong>#${d.orderId.slice(0, 8)}</strong> for <strong>${d.serviceName} — ${d.planName}</strong> is ready!</p>
      <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;font-family:monospace;word-break:break-all">${d.content}</div>
      <p>If you have any issues, contact our support team.</p>
      <hr/><p style="color:#888;font-size:12px">ThickWire — Digital Marketplace</p>
    </div>`;
    }
    tplOutOfStock(d) {
        return `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#f59e0b">Order Under Review ⏳</h2>
      <p>Your order <strong>#${d.orderId.slice(0, 8)}</strong> for <strong>${d.serviceName} — ${d.planName}</strong> is being reviewed by our team.</p>
      <p>We'll deliver it within 24 hours. Thank you for your patience!</p>
      <hr/><p style="color:#888;font-size:12px">ThickWire — Digital Marketplace</p>
    </div>`;
    }
    tplSupportAutoReply(d) {
        return `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#6366f1">Support Ticket Received</h2>
      <p>Hi ${d.customerName},</p>
      <p>We've received your support request <strong>#${d.ticketId.slice(0, 8)}</strong>: "${d.subject}".</p>
      <p>Our team will respond within 24 hours.</p>
      <hr/><p style="color:#888;font-size:12px">ThickWire Support</p>
    </div>`;
    }
    tplLowStock(d) {
        const rows = d.items.map((i) => `<tr><td style="padding:8px;border:1px solid #ddd">${i.serviceName}</td><td style="padding:8px;border:1px solid #ddd">${i.planName}</td><td style="padding:8px;border:1px solid #ddd;color:red"><strong>${i.count}</strong></td></tr>`).join('');
        return `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#ef4444">⚠️ Low Stock Alert</h2>
      <table style="border-collapse:collapse;width:100%"><thead><tr><th style="padding:8px;border:1px solid #ddd;text-align:left">Service</th><th style="padding:8px;border:1px solid #ddd;text-align:left">Plan</th><th style="padding:8px;border:1px solid #ddd;text-align:left">Stock</th></tr></thead><tbody>${rows}</tbody></table>
      <p>Please restock these plans soon.</p>
      <hr/><p style="color:#888;font-size:12px">ThickWire Admin Alert</p>
    </div>`;
    }
};
exports.EmailService = EmailService;
exports.EmailService = EmailService = EmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], EmailService);
//# sourceMappingURL=email.service.js.map