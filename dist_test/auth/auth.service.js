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
var AuthService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = require("bcrypt");
const speakeasy = require("speakeasy");
const QRCode = require("qrcode");
const prisma_service_1 = require("../prisma/prisma.service");
let AuthService = AuthService_1 = class AuthService {
    constructor(prisma, jwt, config) {
        this.prisma = prisma;
        this.jwt = jwt;
        this.config = config;
        this.logger = new common_1.Logger(AuthService_1.name);
    }
    async login(email, password) {
        const admin = await this.prisma.admin.findUnique({ where: { email } });
        if (!admin || !admin.isActive) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const valid = await bcrypt.compare(password, admin.passwordHash);
        if (!valid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        if (admin.totpEnabled) {
            const preAuthToken = this.jwt.sign({ sub: admin.id, purpose: 'totp' }, { expiresIn: '5m' });
            return { requiresTOTP: true, preAuthToken };
        }
        return this.issueTokens(admin.id, admin.email, admin.role);
    }
    async verifyTotp(preAuthToken, totpCode) {
        let payload;
        try {
            payload = this.jwt.verify(preAuthToken);
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid or expired pre-auth token');
        }
        if (payload.purpose !== 'totp') {
            throw new common_1.UnauthorizedException('Invalid token purpose');
        }
        const admin = await this.prisma.admin.findUnique({
            where: { id: payload.sub },
        });
        if (!admin || !admin.totpSecret) {
            throw new common_1.UnauthorizedException('TOTP not configured');
        }
        const verified = speakeasy.totp.verify({
            secret: admin.totpSecret,
            encoding: 'base32',
            token: totpCode,
            window: 1,
        });
        if (!verified) {
            throw new common_1.UnauthorizedException('Invalid TOTP code');
        }
        return this.issueTokens(admin.id, admin.email, admin.role);
    }
    async setupTotp(adminId) {
        const admin = await this.prisma.admin.findUnique({
            where: { id: adminId },
        });
        if (!admin)
            throw new common_1.BadRequestException('Admin not found');
        if (admin.totpEnabled)
            throw new common_1.BadRequestException('TOTP already enabled');
        const secret = speakeasy.generateSecret({
            name: `${this.config.get('TOTP_ISSUER', 'ThickWire')}:${admin.email}`,
        });
        await this.prisma.admin.update({
            where: { id: adminId },
            data: { totpSecret: secret.base32 },
        });
        const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);
        return { secret: secret.base32, qrCode: qrDataUrl };
    }
    async enableTotp(adminId, totpCode) {
        const admin = await this.prisma.admin.findUnique({
            where: { id: adminId },
        });
        if (!admin || !admin.totpSecret) {
            throw new common_1.BadRequestException('TOTP not set up. Call setup-totp first.');
        }
        const verified = speakeasy.totp.verify({
            secret: admin.totpSecret,
            encoding: 'base32',
            token: totpCode,
            window: 1,
        });
        if (!verified)
            throw new common_1.BadRequestException('Invalid TOTP code');
        await this.prisma.admin.update({
            where: { id: adminId },
            data: { totpEnabled: true },
        });
        return { enabled: true };
    }
    async refresh(refreshToken) {
        let payload;
        try {
            payload = this.jwt.verify(refreshToken, {
                secret: this.config.get('JWT_REFRESH_SECRET', 'placeholder_refresh_secret'),
            });
        }
        catch {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
        if (payload.purpose !== 'refresh') {
            throw new common_1.UnauthorizedException('Invalid token purpose');
        }
        const admin = await this.prisma.admin.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, role: true, isActive: true },
        });
        if (!admin || !admin.isActive) {
            throw new common_1.UnauthorizedException('Account disabled');
        }
        return this.issueTokens(admin.id, admin.email, admin.role);
    }
    async issueTokens(id, email, role) {
        await this.prisma.admin.update({
            where: { id },
            data: { lastLoginAt: new Date() },
        });
        const accessToken = this.jwt.sign({ sub: id, email, role }, { expiresIn: '2h' });
        const refreshToken = this.jwt.sign({ sub: id, purpose: 'refresh' }, {
            secret: this.config.get('JWT_REFRESH_SECRET', 'placeholder_refresh_secret'),
            expiresIn: '7d',
        });
        return { accessToken, refreshToken };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = AuthService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService])
], AuthService);
//# sourceMappingURL=auth.service.js.map