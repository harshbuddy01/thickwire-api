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
var CustomerAuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerAuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const email_service_1 = require("../email/email.service");
const bcrypt = require("bcrypt");
const crypto_1 = require("crypto");
let CustomerAuthService = CustomerAuthService_1 = class CustomerAuthService {
    constructor(prisma, jwt, config, email) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.email = email;
        this.logger = new common_1.Logger(CustomerAuthService_1.name);
    }
    async signup(dto) {
        const existing = await this.prisma.customerAccount.findUnique({ where: { email: dto.email } });
        if (existing)
            throw new common_1.ConflictException('An account with this email already exists');
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const verifyToken = (0, crypto_1.randomBytes)(32).toString('hex');
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
        await this.linkGuestOrders(customer.id, customer.email);
        const storefrontUrl = this.config.get('STOREFRONT_URL', 'http://localhost:3000');
        await this.email.sendVerification(customer.email, {
            customerName: customer.name,
            verifyUrl: `${storefrontUrl}/verify-email?token=${verifyToken}`,
        });
        this.logger.log(`Customer signed up: ${customer.email}`);
        return { message: 'Account created. Please check your email to verify.' };
    }
    async verifyEmail(token) {
        const customer = await this.prisma.customerAccount.findFirst({ where: { verifyToken: token } });
        if (!customer)
            throw new common_1.BadRequestException('Invalid or expired verification token');
        await this.prisma.customerAccount.update({
            where: { id: customer.id },
            data: { isVerified: true, verifyToken: null },
        });
        await this.email.sendWelcome(customer.email, { customerName: customer.name });
        const tokens = await this.issueTokens(customer.id);
        return { message: 'Email verified successfully', ...tokens };
    }
    async login(email, password) {
        const customer = await this.prisma.customerAccount.findUnique({ where: { email } });
        if (!customer || !customer.passwordHash)
            throw new common_1.UnauthorizedException('Invalid email or password');
        if (!customer.isActive)
            throw new common_1.UnauthorizedException('Account is deactivated');
        const valid = await bcrypt.compare(password, customer.passwordHash);
        if (!valid)
            throw new common_1.UnauthorizedException('Invalid email or password');
        if (!customer.isVerified)
            throw new common_1.UnauthorizedException('Please verify your email first');
        await this.linkGuestOrders(customer.id, customer.email);
        await this.prisma.customerAccount.update({ where: { id: customer.id }, data: { lastLoginAt: new Date() } });
        return this.issueTokens(customer.id);
    }
    async handleGoogleUser(profile) {
        let customer = await this.prisma.customerAccount.findFirst({
            where: { OR: [{ googleId: profile.googleId }, { email: profile.email }] },
        });
        if (customer) {
            customer = await this.prisma.customerAccount.update({
                where: { id: customer.id },
                data: {
                    googleId: profile.googleId,
                    avatarUrl: profile.avatarUrl || customer.avatarUrl,
                    isVerified: true,
                    lastLoginAt: new Date(),
                },
            });
        }
        else {
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
            const customerEmail = customer.email;
            this.email.sendWelcome(customerEmail, {
                customerName: customer.name,
            }).catch(err => this.logger.error(`Welcome email failed for ${customerEmail}: ${err.message}`));
        }
        await this.linkGuestOrders(customer.id, customer.email);
        return this.issueTokens(customer.id);
    }
    async refresh(refreshToken) {
        const session = await this.prisma.customerSession.findUnique({ where: { refreshToken } });
        if (!session || session.expiresAt < new Date()) {
            if (session)
                await this.prisma.customerSession.delete({ where: { id: session.id } });
            throw new common_1.UnauthorizedException('Invalid or expired refresh token');
        }
        const customer = await this.prisma.customerAccount.findUnique({ where: { id: session.customerId } });
        if (!customer || !customer.isActive)
            throw new common_1.UnauthorizedException('Account not found or deactivated');
        await this.prisma.customerSession.delete({ where: { id: session.id } });
        return this.issueTokens(customer.id);
    }
    async logout(refreshToken) {
        try {
            await this.prisma.customerSession.delete({ where: { refreshToken } });
        }
        catch {
        }
    }
    async forgotPassword(email) {
        const customer = await this.prisma.customerAccount.findUnique({ where: { email } });
        if (!customer)
            return { message: 'If an account exists, a reset link has been sent' };
        const resetToken = (0, crypto_1.randomBytes)(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
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
    async resetPassword(token, newPassword) {
        const customer = await this.prisma.customerAccount.findFirst({
            where: { resetToken: token, resetTokenExpiry: { gte: new Date() } },
        });
        if (!customer)
            throw new common_1.BadRequestException('Invalid or expired reset token');
        const passwordHash = await bcrypt.hash(newPassword, 12);
        await this.prisma.customerAccount.update({
            where: { id: customer.id },
            data: { passwordHash, resetToken: null, resetTokenExpiry: null },
        });
        return { message: 'Password reset successfully' };
    }
    async getProfile(customerId) {
        const customer = await this.prisma.customerAccount.findUnique({
            where: { id: customerId },
            select: { id: true, name: true, email: true, phone: true, avatarUrl: true, whatsappOptedIn: true, googleId: true, isVerified: true, createdAt: true, passwordHash: true },
        });
        if (!customer)
            throw new common_1.NotFoundException('Customer not found');
        const { passwordHash, ...profile } = customer;
        return { ...profile, hasPassword: passwordHash !== null };
    }
    async updateProfile(customerId, dto) {
        return this.prisma.customerAccount.update({
            where: { id: customerId },
            data: dto,
            select: { id: true, name: true, email: true, phone: true, whatsappOptedIn: true },
        });
    }
    async issueTokens(customerId) {
        const accessToken = this.jwt.sign({ sub: customerId, type: 'customer' }, { expiresIn: '2h' });
        const refreshToken = (0, crypto_1.randomBytes)(48).toString('hex');
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await this.prisma.customerSession.create({
            data: { customerId, refreshToken, expiresAt },
        });
        return { accessToken, refreshToken, expiresAt };
    }
    async linkGuestOrders(customerId, email) {
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
};
exports.CustomerAuthService = CustomerAuthService;
exports.CustomerAuthService = CustomerAuthService = CustomerAuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        email_service_1.EmailService])
], CustomerAuthService);
//# sourceMappingURL=customer-auth.service.js.map