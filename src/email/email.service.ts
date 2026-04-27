import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private resend: any;
  private fromEmail: string;

  constructor(private readonly config: ConfigService) {
    const { Resend } = require('resend');
    this.resend = new Resend(this.config.getOrThrow('RESEND_API_KEY'));
    this.fromEmail = this.config.get('RESEND_FROM_EMAIL', 'orders@yourdomain.com');
  }

  async sendOrderConfirmation(to: string, data: { customerName: string; orderId: string; serviceName: string; planName: string; amount: string }) {
    return this.send(to, 'Order Confirmed — ThickWire', this.tplOrderConfirmation(data));
  }

  async sendDelivery(to: string, data: { customerName: string; orderId: string; serviceName: string; planName: string; content: string }) {
    return this.send(to, 'Your Order is Ready — ThickWire', this.tplDelivery(data));
  }

  async sendOutOfStock(to: string, data: { orderId: string; serviceName: string; planName: string }) {
    return this.send(to, 'Order Under Review — ThickWire', this.tplOutOfStock(data));
  }

  async sendSupportAutoReply(to: string, data: { customerName: string; ticketId: string; subject: string }) {
    return this.send(to, `Re: ${data.subject} — ThickWire Support`, this.tplSupportAutoReply(data));
  }

  async sendSupportReply(to: string, data: { customerName: string; ticketId: string; subject: string; replyText: string }) {
    return this.send(to, `Re: ${data.subject} — ThickWire Support`, `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#6366f1">Support Reply</h2>
      <p>Hi ${data.customerName},</p>
      <p>Our team has replied to your support request <strong>#${data.ticketId.slice(0, 8)}</strong>.</p>
      <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;white-space:pre-wrap;">${data.replyText}</div>
      <p>If you have further questions, please reply to this email or open a new ticket.</p>
      <hr/><p style="color:#888;font-size:12px">ThickWire Support</p>
    </div>`);
  }

  async sendLowStockAlert(to: string, data: { items: { serviceName: string; planName: string; count: number }[] }) {
    return this.send(to, '⚠️ Low Stock Alert — ThickWire', this.tplLowStock(data));
  }

  // ─── Phase 2: Customer Auth Emails ────────────────────

  async sendVerification(to: string, data: { customerName: string; verifyUrl: string }) {
    return this.send(to, 'Verify your email address — ThickWire', `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#6366f1">Verify Your Email</h2>
      <p>Hi ${data.customerName},</p>
      <p>Thanks for signing up! Click the button below to verify your email address.</p>
      <a href="${data.verifyUrl}" style="display:inline-block;background:#6366f1;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Verify Email</a>
      <p style="color:#888;font-size:13px">If you didn't create an account, you can safely ignore this email.</p>
      <hr/><p style="color:#888;font-size:12px">ThickWire — Digital Marketplace</p>
    </div>`);
  }

  async sendWelcome(to: string, data: { customerName: string }) {
    return this.send(to, 'Welcome to ThickWire!', `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#22c55e">Welcome aboard! 🎉</h2>
      <p>Hi ${data.customerName},</p>
      <p>Your email has been verified and your account is all set up.</p>
      <p>You can now track your orders, manage subscriptions, and get expiry reminders — all from your account dashboard.</p>
      <a href="${process.env.STOREFRONT_URL || 'http://localhost:3000'}/account" style="display:inline-block;background:#22c55e;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Go to My Account</a>
      <hr/><p style="color:#888;font-size:12px">ThickWire — Digital Marketplace</p>
    </div>`);
  }

  async sendPasswordReset(to: string, data: { customerName: string; resetUrl: string }) {
    return this.send(to, 'Reset your password — ThickWire', `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#f59e0b">Reset Your Password</h2>
      <p>Hi ${data.customerName},</p>
      <p>We received a request to reset your password. Click below to set a new one:</p>
      <a href="${data.resetUrl}" style="display:inline-block;background:#f59e0b;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Reset Password</a>
      <p style="color:#888;font-size:13px">This link expires in 1 hour. If you didn't request this, your account is safe.</p>
      <hr/><p style="color:#888;font-size:12px">ThickWire — Digital Marketplace</p>
    </div>`);
  }

  // ─── Phase 2: Subscription Expiry Emails ─────────────

  async sendExpiryReminder(to: string, data: { customerName: string; serviceName: string; planName: string; expiryDate: string; daysLeft: number; renewUrl: string }) {
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
    </div>`);
  }

  private async send(to: string, subject: string, html: string) {
    try {
      await this.resend.emails.send({ from: this.fromEmail, to, subject, html });
      this.logger.log(`Email sent to ${to}: ${subject}`);
      return true;
    } catch (err) {
      this.logger.error(`Email failed to ${to}: ${err.message}`);
      return false;
    }
  }

  // ─── Templates ────────────────────────────────────────

  private tplOrderConfirmation(d: any) {
    return `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#6366f1">Order Confirmed ✅</h2>
      <p>Hi ${d.customerName},</p>
      <p>Your order <strong>#${d.orderId.slice(0, 8)}</strong> for <strong>${d.serviceName} — ${d.planName}</strong> has been confirmed.</p>
      <p>Amount: ₹${d.amount}</p>
      <p>We're processing your order and will deliver it shortly.</p>
      <hr/><p style="color:#888;font-size:12px">ThickWire — Digital Marketplace</p>
    </div>`;
  }

  private tplDelivery(d: any) {
    return `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#22c55e">Order Delivered 🎉</h2>
      <p>Hi ${d.customerName},</p>
      <p>Your order <strong>#${d.orderId.slice(0, 8)}</strong> for <strong>${d.serviceName} — ${d.planName}</strong> is ready!</p>
      <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;font-family:monospace;word-break:break-all">${d.content}</div>
      <p>If you have any issues, contact our support team.</p>
      <hr/><p style="color:#888;font-size:12px">ThickWire — Digital Marketplace</p>
    </div>`;
  }

  private tplOutOfStock(d: any) {
    return `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#f59e0b">Order Under Review ⏳</h2>
      <p>Your order <strong>#${d.orderId.slice(0, 8)}</strong> for <strong>${d.serviceName} — ${d.planName}</strong> is being reviewed by our team.</p>
      <p>We'll deliver it within 24 hours. Thank you for your patience!</p>
      <hr/><p style="color:#888;font-size:12px">ThickWire — Digital Marketplace</p>
    </div>`;
  }

  private tplSupportAutoReply(d: any) {
    return `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#6366f1">Support Ticket Received</h2>
      <p>Hi ${d.customerName},</p>
      <p>We've received your support request <strong>#${d.ticketId.slice(0, 8)}</strong>: "${d.subject}".</p>
      <p>Our team will respond within 24 hours.</p>
      <hr/><p style="color:#888;font-size:12px">ThickWire Support</p>
    </div>`;
  }

  private tplLowStock(d: any) {
    const rows = d.items.map((i: any) =>
      `<tr><td style="padding:8px;border:1px solid #ddd">${i.serviceName}</td><td style="padding:8px;border:1px solid #ddd">${i.planName}</td><td style="padding:8px;border:1px solid #ddd;color:red"><strong>${i.count}</strong></td></tr>`
    ).join('');
    return `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#ef4444">⚠️ Low Stock Alert</h2>
      <table style="border-collapse:collapse;width:100%"><thead><tr><th style="padding:8px;border:1px solid #ddd;text-align:left">Service</th><th style="padding:8px;border:1px solid #ddd;text-align:left">Plan</th><th style="padding:8px;border:1px solid #ddd;text-align:left">Stock</th></tr></thead><tbody>${rows}</tbody></table>
      <p>Please restock these plans soon.</p>
      <hr/><p style="color:#888;font-size:12px">ThickWire Admin Alert</p>
    </div>`;
  }
}
