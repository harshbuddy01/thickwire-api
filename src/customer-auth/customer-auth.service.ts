import { Injectable, Logger, ConflictException, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

@Injectable()
export class CustomerAuthService {
    private readonly logger = new Logger(CustomerAuthService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
        private readonly config: ConfigService,
        private readonly email: EmailService,
    ) { }

    // ── Signup ──────────────────────────────────────────
    async signup(dto: { name: string; email: string; password: string; phone?: string; whatsappOptedIn?: boolean }) {
        const existing = await this.prisma.customerAccount.findUnique({ where: { email: dto.email } });
        if (existing) throw new ConflictException('An account with this email already exists');

        const passwordHash = await bcrypt.hash(dto.password, 12);
        const verifyToken = randomBytes(32).toString('hex');

        const customer = await this.prisma.customerAccount.create({
            data: {
                name: dto.name,
                email: dto.email,
                passwordHash,
                phone: dto.phone || null,
                whatsappOptedIn: dto.whatsappOptedIn ?? false,
                verifyToken,
                isVerified: false,
            },
        });

        // Link any past guest orders to this new account
        await this.linkGuestOrders(customer.id, customer.email);

        // Send verification email
        const storefrontUrl = this.config.get('STOREFRONT_URL', 'http://localhost:3000');
        await this.email.sendVerification(customer.email, {
            customerName: customer.name,
            verifyUrl: `${storefrontUrl}/verify-email?token=${verifyToken}`,
        });

        this.logger.log(`Customer signed up: ${customer.email}`);
        return { message: 'Account created. Please check your email to verify.' };
    }

    // ── Verify Email ───────────────────────────────────
    async verifyEmail(token: string) {
        const customer = await this.prisma.customerAccount.findFirst({ where: { verifyToken: token } });
        if (!customer) throw new BadRequestException('Invalid or expired verification token');

        await this.prisma.customerAccount.update({
            where: { id: customer.id },
            data: { isVerified: true, verifyToken: null },
        });

        // Send welcome email
        await this.email.sendWelcome(customer.email, { customerName: customer.name });

        return { message: 'Email verified successfully' };
    }

    // ── Login ──────────────────────────────────────────
    async login(email: string, password: string) {
        const customer = await this.prisma.customerAccount.findUnique({ where: { email } });
        if (!customer || !customer.passwordHash) throw new UnauthorizedException('Invalid email or password');
        if (!customer.isActive) throw new UnauthorizedException('Account is deactivated');

        const valid = await bcrypt.compare(password, customer.passwordHash);
        if (!valid) throw new UnauthorizedException('Invalid email or password');

        if (!customer.isVerified) throw new UnauthorizedException('Please verify your email first');

        // Link guest orders on every login too
        await this.linkGuestOrders(customer.id, customer.email);

        // Update last login
        await this.prisma.customerAccount.update({ where: { id: customer.id }, data: { lastLoginAt: new Date() } });

        return this.issueTokens(customer.id);
    }

    // ── Google OAuth ───────────────────────────────────
    async handleGoogleUser(profile: { googleId: string; email: string; name: string; avatarUrl?: string }) {
        let customer = await this.prisma.customerAccount.findFirst({
            where: { OR: [{ googleId: profile.googleId }, { email: profile.email }] },
        });

        if (customer) {
            // Update existing account with Google info
            customer = await this.prisma.customerAccount.update({
                where: { id: customer.id },
                data: {
                    googleId: profile.googleId,
                    avatarUrl: profile.avatarUrl || customer.avatarUrl,
                    isVerified: true,
                    lastLoginAt: new Date(),
                },
            });
        } else {
            // Create new account
            customer = await this.prisma.customerAccount.create({
                data: {
                    name: profile.name,
                    email: profile.email,
                    googleId: profile.googleId,
                    avatarUrl: profile.avatarUrl,
                    isVerified: true,
                    lastLoginAt: new Date(),
                },
            });
        }

        // Link guest orders
        await this.linkGuestOrders(customer.id, customer.email);

        return this.issueTokens(customer.id);
    }

    // ── Refresh Token ──────────────────────────────────
    async refresh(refreshToken: string) {
        const session = await this.prisma.customerSession.findUnique({ where: { refreshToken } });
        if (!session || session.expiresAt < new Date()) {
            if (session) await this.prisma.customerSession.delete({ where: { id: session.id } });
            throw new UnauthorizedException('Invalid or expired refresh token');
        }

        const customer = await this.prisma.customerAccount.findUnique({ where: { id: session.customerId } });
        if (!customer || !customer.isActive) throw new UnauthorizedException('Account not found or deactivated');

        // Rotate refresh token
        await this.prisma.customerSession.delete({ where: { id: session.id } });
        return this.issueTokens(customer.id);
    }

    // ── Logout ─────────────────────────────────────────
    async logout(refreshToken: string) {
        try {
            await this.prisma.customerSession.delete({ where: { refreshToken } });
        } catch {
            // Already deleted or not found — fine
        }
    }

    // ── Forgot Password ────────────────────────────────
    async forgotPassword(email: string) {
        const customer = await this.prisma.customerAccount.findUnique({ where: { email } });
        if (!customer) return { message: 'If an account exists, a reset link has been sent' };

        const resetToken = randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await this.prisma.customerAccount.update({
            where: { id: customer.id },
            data: { resetToken, resetTokenExpiry },
        });

        const storefrontUrl = this.config.get('STOREFRONT_URL', 'http://localhost:3000');
        await this.email.sendPasswordReset(customer.email, {
            customerName: customer.name,
            resetUrl: `${storefrontUrl}/reset-password?token=${resetToken}`,
        });

        return { message: 'If an account exists, a reset link has been sent' };
    }

    // ── Reset Password ─────────────────────────────────
    async resetPassword(token: string, newPassword: string) {
        const customer = await this.prisma.customerAccount.findFirst({
            where: { resetToken: token, resetTokenExpiry: { gte: new Date() } },
        });
        if (!customer) throw new BadRequestException('Invalid or expired reset token');

        const passwordHash = await bcrypt.hash(newPassword, 12);
        await this.prisma.customerAccount.update({
            where: { id: customer.id },
            data: { passwordHash, resetToken: null, resetTokenExpiry: null },
        });

        return { message: 'Password reset successfully' };
    }

    // ── Get Profile ────────────────────────────────────
    async getProfile(customerId: string) {
        const customer = await this.prisma.customerAccount.findUnique({
            where: { id: customerId },
            select: { id: true, name: true, email: true, phone: true, avatarUrl: true, whatsappOptedIn: true, googleId: true, isVerified: true, createdAt: true },
        });
        if (!customer) throw new NotFoundException('Customer not found');
        return { ...customer, hasPassword: !customer.googleId || !!customer.googleId }; // always true, just indicates auth method
    }

    // ── Update Profile ─────────────────────────────────
    async updateProfile(customerId: string, dto: { name?: string; phone?: string; whatsappOptedIn?: boolean }) {
        return this.prisma.customerAccount.update({
            where: { id: customerId },
            data: dto,
            select: { id: true, name: true, email: true, phone: true, whatsappOptedIn: true },
        });
    }

    // ── Internal Helpers ───────────────────────────────
    private async issueTokens(customerId: string) {
        const accessToken = this.jwt.sign({ sub: customerId, type: 'customer' });

        const refreshToken = randomBytes(48).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

        await this.prisma.customerSession.create({
            data: { customerId, refreshToken, expiresAt },
        });

        return { accessToken, refreshToken, expiresAt };
    }

    private async linkGuestOrders(customerId: string, email: string) {
        const [ordersLinked, expiryLinked] = await Promise.all([
            this.prisma.order.updateMany({
                where: { customerEmail: email, customerId: null },
                data: { customerId },
            }),
            this.prisma.subscriptionExpiry.updateMany({
                where: { customerEmail: email, customerId: null },
                data: { customerId },
            }),
        ]);

        if (ordersLinked.count > 0) {
            this.logger.log(`Linked ${ordersLinked.count} guest orders to customer ${email}`);
        }
    }
}
