import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private apiKey: string;
  private fromEmail: string;
  private supportEmail: string;
  private ordersEmail: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get('BREVO_API_KEY', '');
    
    
    // The actual email addresses to use
    const baseOrdersEmail = this.config.get('SMTP_ORDERS_EMAIL', 'orders@streamkart.store');
    const baseSupportEmail = this.config.get('SMTP_SUPPORT_EMAIL', 'support@streamkart.store');
    
    // The visual name shown in the customer's inbox
    this.ordersEmail = `StreamKart <${baseOrdersEmail}>`;
    this.supportEmail = `StreamKart Support <${baseSupportEmail}>`;
    
    // Fallback if no specific 'from' is provided
    this.fromEmail = baseOrdersEmail;
  }

  async sendOrderConfirmation(to: string, data: { customerName: string; orderId: string; serviceName: string; planName: string; amount: string }) {
    return this.send(to, 'Order Confirmed — StreamKart', this.tplOrderConfirmation(data), { from: this.ordersEmail, replyTo: 'support@streamkart.store' });
  }

  async sendDelivery(to: string, data: { customerName: string; orderId: string; serviceName: string; planName: string; content: string }) {
    return this.send(to, 'Your Order is Ready — StreamKart', this.tplDelivery(data), { from: this.ordersEmail, replyTo: 'support@streamkart.store' });
  }

  async sendOutOfStock(to: string, data: { orderId: string; serviceName: string; planName: string }) {
    return this.send(to, 'Order Under Review — StreamKart', this.tplOutOfStock(data), { from: this.ordersEmail, replyTo: 'support@streamkart.store' });
  }

  async sendSupportAutoReply(to: string, data: { customerName: string; ticketId: string; subject: string }) {
    return this.send(to, `Re: ${data.subject} — StreamKart Support`, this.tplSupportAutoReply(data), { from: this.supportEmail, replyTo: 'support@streamkart.store' });
  }

  async sendSupportReply(to: string, data: { customerName: string; ticketId: string; subject: string; replyText: string }) {
    return this.send(to, `[Update] Ticket #${data.ticketId.slice(0, 8)}: ${data.subject}`, `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px;border:1px solid #eee;border-radius:12px;">
      <h2 style="color:#6366f1">Support Reply</h2>
      <p>Hi ${data.customerName},</p>
      <p>Our team has replied to your support request <strong>#${data.ticketId.slice(0, 8)}</strong>.</p>
      <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;white-space:pre-wrap;">${data.replyText}</div>
      <p>If you have further questions, please reply to this email or open a new ticket.</p>
      <hr/><p style="color:#888;font-size:12px">StreamKart Support</p>
    </div>`, { from: this.supportEmail, replyTo: 'support@streamkart.store' });
  }

  async sendLowStockAlert(to: string, data: { items: { serviceName: string; planName: string; count: number }[] }) {
    return this.send(to, '⚠️ Low Stock Alert — StreamKart', this.tplLowStock(data), { from: this.ordersEmail });
  }

  async sendAdminNotification(data: { subject: string; body: string }) {
    const fallbackEmail = this.config.get<string>('SMTP_FROM_EMAIL', 'orders@streamkart.store');
    const adminEmail = this.config.get<string>('ADMIN_NOTIFICATION_EMAIL', fallbackEmail);
    return this.send(adminEmail, data.subject, `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:20px">
      <h2 style="color:#6366f1">Support Notification</h2>
      <div style="background:#f3f4f6;padding:16px;border-radius:8px;margin:16px 0;white-space:pre-wrap;">${data.body}</div>
      <hr/><p style="color:#888;font-size:12px">StreamKart Admin Alert</p>
    </div>`, { from: this.supportEmail });
  }

  // ─── Phase 2: Customer Auth Emails ────────────────────

  async sendVerification(to: string, data: { customerName: string; verifyUrl: string }) {
    return this.send(to, 'Verify your email address — StreamKart', `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:40px;border:1px solid #f0f0f0;border-radius:24px;text-align:center;">
      <h2 style="color:#0f172a;font-size:24px;margin-bottom:16px;">Verify Your Email</h2>
      <p style="color:#475569;font-size:16px;line-height:1.6;">Hi ${data.customerName},</p>
      <p style="color:#475569;font-size:16px;line-height:1.6;">Thanks for signing up at StreamKart! Please click the button below to verify your email address and activate your account.</p>
      <a href="${data.verifyUrl}" style="display:inline-block;background:#6366f1;color:white;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:700;margin:24px 0;box-shadow:0 10px 20px rgba(99,102,241,0.2);">Verify Email Address</a>
      <p style="color:#94a3b8;font-size:13px;">If you didn't create an account, you can safely ignore this email.</p>
      <hr style="border:0;border-top:1px solid #eee;margin:32px 0;"/>
      <p style="color:#94a3b8;font-size:12px;">StreamKart — Your Premium Digital Marketplace</p>
    </div>`, { from: this.supportEmail, replyTo: 'support@streamkart.store' });
  }

  async sendWelcome(to: string, data: { customerName: string }) {
    return this.send(to, 'Welcome to StreamKart! 🎉', `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:40px;border:1px solid #f0f0f0;border-radius:24px;text-align:center;">
      <h2 style="color:#10b981;font-size:26px;margin-bottom:16px;">Welcome aboard! 🎉</h2>
      <p style="color:#475569;font-size:16px;line-height:1.6;">Hi ${data.customerName},</p>
      <p style="color:#475569;font-size:16px;line-height:1.6;">Your email has been successfully verified. Your account is now all set up and ready to go.</p>
      <p style="color:#475569;font-size:16px;line-height:1.6;">You can now track your orders, manage subscriptions, and get expiry reminders directly from your dashboard.</p>
      <a href="${this.config.get('STOREFRONT_URL', 'http://localhost:3000')}/account" style="display:inline-block;background:#10b981;color:white;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:700;margin:24px 0;box-shadow:0 10px 20px rgba(16,185,129,0.2);">Go to My Account</a>
      <hr style="border:0;border-top:1px solid #eee;margin:32px 0;"/>
      <p style="color:#94a3b8;font-size:12px;">StreamKart — Your Premium Digital Marketplace</p>
    </div>`, { from: this.supportEmail, replyTo: 'support@streamkart.store' });
  }

  async sendLoginAlert(to: string, data: { customerName: string; ip?: string; userAgent?: string }) {
    return this.send(to, 'New Login detected — StreamKart', `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:40px;border:1px solid #f0f0f0;border-radius:24px;">
      <h2 style="color:#0f172a;font-size:22px;margin-bottom:16px;">New Login Alert</h2>
      <p style="color:#475569;font-size:16px;line-height:1.6;">Hi ${data.customerName},</p>
      <p style="color:#475569;font-size:16px;line-height:1.6;">This is to notify you that a new login was detected for your StreamKart account.</p>
      <div style="background:#f8fafc;padding:20px;border-radius:12px;margin:20px 0;border:1px solid #e2e8f0;">
        <p style="margin:0 0 8px 0;font-size:14px;color:#64748b;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        ${data.ip ? `<p style="margin:0 0 8px 0;font-size:14px;color:#64748b;"><strong>IP Address:</strong> ${data.ip}</p>` : ''}
        ${data.userAgent ? `<p style="margin:0;font-size:14px;color:#64748b;"><strong>Device:</strong> ${data.userAgent}</p>` : ''}
      </div>
      <p style="color:#475569;font-size:15px;">If this was you, you can safely ignore this email. If you don't recognize this activity, please reset your password immediately.</p>
      <hr style="border:0;border-top:1px solid #eee;margin:32px 0;"/>
      <p style="color:#94a3b8;font-size:12px;">StreamKart Security</p>
    </div>`, { from: this.supportEmail, replyTo: 'support@streamkart.store' });
  }

  async sendPasswordReset(to: string, data: { customerName: string; resetUrl: string }) {
    return this.send(to, 'Reset your password — StreamKart', `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:40px;border:1px solid #f0f0f0;border-radius:24px;text-align:center;">
      <h2 style="color:#f59e0b;font-size:24px;margin-bottom:16px;">Reset Your Password</h2>
      <p style="color:#475569;font-size:16px;line-height:1.6;">Hi ${data.customerName},</p>
      <p style="color:#475569;font-size:16px;line-height:1.6;">We received a request to reset your password. Click the button below to choose a new one:</p>
      <a href="${data.resetUrl}" style="display:inline-block;background:#f59e0b;color:white;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:700;margin:24px 0;box-shadow:0 10px 20px rgba(245,158,11,0.2);">Reset Password</a>
      <p style="color:#94a3b8;font-size:13px;">This link expires in 1 hour. If you didn't request this, your account is safe.</p>
      <hr style="border:0;border-top:1px solid #eee;margin:32px 0;"/>
      <p style="color:#94a3b8;font-size:12px;">StreamKart Security</p>
    </div>`, { from: this.supportEmail, replyTo: 'support@streamkart.store' });
  }

  // ─── Phase 2: Subscription Expiry Emails ─────────────

  async sendExpiryReminder(to: string, data: { customerName: string; serviceName: string; planName: string; expiryDate: string; daysLeft: number; renewUrl: string }) {
    const urgency = data.daysLeft <= 1 ? { color: '#ef4444', label: 'LAST DAY', subject: `Last day! Your ${data.serviceName} expires tomorrow` }
      : data.daysLeft <= 3 ? { color: '#f59e0b', label: 'URGENT', subject: `Your ${data.serviceName} expires in ${data.daysLeft} days` }
        : { color: '#6366f1', label: 'REMINDER', subject: `Your ${data.serviceName} expires in ${data.daysLeft} days` };

    return this.send(to, `${urgency.subject} — StreamKart`, `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:40px;border:1px solid #f0f0f0;border-radius:24px;">
      <h2 style="color:${urgency.color}">${urgency.label}: Subscription Expiring</h2>
      <p>Hi ${data.customerName},</p>
      <p>Your <strong>${data.serviceName} — ${data.planName}</strong> subscription expires on <strong>${data.expiryDate}</strong> (${data.daysLeft} day${data.daysLeft > 1 ? 's' : ''} remaining).</p>
      <a href="${data.renewUrl}" style="display:inline-block;background:${urgency.color};color:white;padding:16px 32px;border-radius:12px;text-decoration:none;font-weight:700;margin:24px 0;box-shadow:0 10px 20px rgba(0,0,0,0.1);">Renew Now</a>
      <p style="color:#888;font-size:13px">Don't lose access — renew before it expires.</p>
      <hr style="border:0;border-top:1px solid #eee;margin:32px 0;"/>
      <p style="color:#94a3b8;font-size:12px;">StreamKart — Digital Marketplace</p>
    </div>`, { from: this.ordersEmail, replyTo: 'support@streamkart.store' });
  }

  async sendOrderProcessingDelay(to: string, data: { customerName: string; orderId: string; serviceName: string; planName: string }) {
    return this.send(to, 'Important Update on Your Order — StreamKart', `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:40px;border:1px solid #f0f0f0;border-radius:24px;">
      <h2 style="color:#f59e0b">Order Under Processing ⏳</h2>
      <p>Hi ${data.customerName},</p>
      <p>Your payment for <strong>${data.serviceName} — ${data.planName}</strong> (Order #${data.orderId.slice(0, 8)}) was successful!</p>
      <p>We are currently experiencing a slight delay in automatically delivering your credentials. Our team has been notified and is working to fulfill your order manually as quickly as possible.</p>
      <p>You will receive another email with your credentials very soon.</p>
      <hr style="border:0;border-top:1px solid #eee;margin:32px 0;"/>
      <p style="color:#94a3b8;font-size:12px;">StreamKart Support</p>
    </div>`, { from: this.ordersEmail, replyTo: 'support@streamkart.store' });
  }

  private async send(to: string, subject: string, html: string, options?: { from?: string; replyTo?: string }) {
    try {
      const axios = require('axios');
      
      const payload = {
        sender: { 
          name: options?.from ? options.from.split('<')[0].trim() : 'StreamKart', 
          email: options?.from ? options.from.match(/<([^>]+)>/)?.[1] || this.fromEmail : this.fromEmail 
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
        replyTo: options?.replyTo ? { email: options.replyTo } : undefined
      };

      await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
        headers: {
          'api-key': this.apiKey,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      this.logger.log(`Email sent via API to ${to}: ${subject}`);
      return true;
    } catch (err: any) {
      this.logger.error(`API Email failed to ${to}: ${err.response?.data?.message || err.message}`);
      return false;
    }
  }

  // ─── Templates ────────────────────────────────────────

  private tplOrderConfirmation(d: any) {
    return `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:40px;border:1px solid #f0f0f0;border-radius:24px;">
      <h2 style="color:#6366f1">Order Confirmed ✅</h2>
      <p>Hi ${d.customerName},</p>
      <p>Your order <strong>#${d.orderId.slice(0, 8)}</strong> for <strong>${d.serviceName} — ${d.planName}</strong> has been confirmed.</p>
      <p>Amount: ₹${d.amount}</p>
      <p>We're processing your order and will deliver it shortly.</p>
      <hr style="border:0;border-top:1px solid #eee;margin:32px 0;"/>
      <p style="color:#94a3b8;font-size:12px;">StreamKart — Digital Marketplace</p>
    </div>`;
  }

  private tplDelivery(d: any) {
    return `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:40px;border:1px solid #f0f0f0;border-radius:24px;">
      <h2 style="color:#22c55e">Order Delivered 🎉</h2>
      <p>Hi ${d.customerName},</p>
      <p>Your order <strong>#${d.orderId.slice(0, 8)}</strong> for <strong>${d.serviceName} — ${d.planName}</strong> is ready!</p>
      <div style="background:#f3f4f6;padding:24px;border-radius:12px;margin:24px 0;font-family:monospace;word-break:break-all;border:1px solid #e2e8f0;color:#0f172a;font-size:15px;">${d.content}</div>
      <p>If you have any issues, contact our support team.</p>
      <hr style="border:0;border-top:1px solid #eee;margin:32px 0;"/>
      <p style="color:#94a3b8;font-size:12px;">StreamKart — Digital Marketplace</p>
    </div>`;
  }

  private tplOutOfStock(d: any) {
    return `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:40px;border:1px solid #f0f0f0;border-radius:24px;">
      <h2 style="color:#f59e0b">Order Under Review ⏳</h2>
      <p>Your order <strong>#${d.orderId.slice(0, 8)}</strong> for <strong>${d.serviceName} — ${d.planName}</strong> is being reviewed by our team.</p>
      <p>We'll deliver it within 24 hours. Thank you for your patience!</p>
      <hr style="border:0;border-top:1px solid #eee;margin:32px 0;"/>
      <p style="color:#94a3b8;font-size:12px;">StreamKart — Digital Marketplace</p>
    </div>`;
  }

  private tplSupportAutoReply(d: any) {
    return `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:40px;border:1px solid #f0f0f0;border-radius:24px;">
      <h2 style="color:#6366f1">Support Ticket Received</h2>
      <p>Hi ${d.customerName},</p>
      <p>We've received your support request <strong>#${d.ticketId.slice(0, 8)}</strong>: "${d.subject}".</p>
      <p>Our team will respond within 24 hours.</p>
      <hr style="border:0;border-top:1px solid #eee;margin:32px 0;"/>
      <p style="color:#94a3b8;font-size:12px;">StreamKart Support</p>
    </div>`;
  }

  private tplLowStock(d: any) {
    const rows = d.items.map((i: any) =>
      `<tr><td style="padding:12px;border:1px solid #eee">${i.serviceName}</td><td style="padding:12px;border:1px solid #eee">${i.planName}</td><td style="padding:12px;border:1px solid #eee;color:#ef4444"><strong>${i.count}</strong></td></tr>`
    ).join('');
    return `<div style="font-family:sans-serif;max-width:600px;margin:auto;padding:40px;border:1px solid #f0f0f0;border-radius:24px;">
      <h2 style="color:#ef4444;margin-bottom:24px;">⚠️ Low Stock Alert</h2>
      <table style="border-collapse:collapse;width:100%;border:1px solid #eee;"><thead><tr style="background:#f8fafc;"><th style="padding:12px;border:1px solid #eee;text-align:left">Service</th><th style="padding:12px;border:1px solid #eee;text-align:left">Plan</th><th style="padding:12px;border:1px solid #eee;text-align:left">Stock</th></tr></thead><tbody>${rows}</tbody></table>
      <p style="margin-top:24px;">Please restock these plans soon.</p>
      <hr style="border:0;border-top:1px solid #eee;margin:32px 0;"/>
      <p style="color:#94a3b8;font-size:12px;">StreamKart Admin Alert</p>
    </div>`;
  }
}
