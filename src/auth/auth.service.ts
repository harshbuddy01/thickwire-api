import {
    Injectable,
    UnauthorizedException,
    BadRequestException,
    Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly jwt: JwtService,
        private readonly config: ConfigService,
    ) { }

    async login(email: string, password: string) {
        const admin = await this.prisma.admin.findUnique({ where: { email } });
        if (!admin || !admin.isActive) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const valid = await bcrypt.compare(password, admin.passwordHash);
        if (!valid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (admin.totpEnabled) {
            // Return a temporary pre-auth token for TOTP step
            const preAuthToken = this.jwt.sign(
                { sub: admin.id, purpose: 'totp' },
                { expiresIn: '5m' },
            );
            return { requiresTOTP: true, preAuthToken };
        }

        // No TOTP — issue full tokens
        return this.issueTokens(admin.id, admin.email, admin.role);
    }

    async verifyTotp(preAuthToken: string, totpCode: string) {
        let payload: { sub: string; purpose: string };
        try {
            payload = this.jwt.verify(preAuthToken);
        } catch {
            throw new UnauthorizedException('Invalid or expired pre-auth token');
        }

        if (payload.purpose !== 'totp') {
            throw new UnauthorizedException('Invalid token purpose');
        }

        const admin = await this.prisma.admin.findUnique({
            where: { id: payload.sub },
        });
        if (!admin || !admin.totpSecret) {
            throw new UnauthorizedException('TOTP not configured');
        }

        const verified = speakeasy.totp.verify({
            secret: admin.totpSecret,
            encoding: 'base32',
            token: totpCode,
            window: 1,
        });

        if (!verified) {
            throw new UnauthorizedException('Invalid TOTP code');
        }

        return this.issueTokens(admin.id, admin.email, admin.role);
    }

    async setupTotp(adminId: string) {
        const admin = await this.prisma.admin.findUnique({
            where: { id: adminId },
        });
        if (!admin) throw new BadRequestException('Admin not found');
        if (admin.totpEnabled) throw new BadRequestException('TOTP already enabled');

        const secret = speakeasy.generateSecret({
            name: `${this.config.get('TOTP_ISSUER', 'ThickWire')}:${admin.email}`,
        });

        await this.prisma.admin.update({
            where: { id: adminId },
            data: { totpSecret: secret.base32 },
        });

        const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url!);
        return { secret: secret.base32, qrCode: qrDataUrl };
    }

    async enableTotp(adminId: string, totpCode: string) {
        const admin = await this.prisma.admin.findUnique({
            where: { id: adminId },
        });
        if (!admin || !admin.totpSecret) {
            throw new BadRequestException('TOTP not set up. Call setup-totp first.');
        }

        const verified = speakeasy.totp.verify({
            secret: admin.totpSecret,
            encoding: 'base32',
            token: totpCode,
            window: 1,
        });

        if (!verified) throw new BadRequestException('Invalid TOTP code');

        await this.prisma.admin.update({
            where: { id: adminId },
            data: { totpEnabled: true },
        });
        return { enabled: true };
    }

    async refresh(refreshToken: string) {
        let payload: { sub: string; purpose: string };
        try {
            payload = this.jwt.verify(refreshToken, {
                secret: this.config.get('JWT_REFRESH_SECRET', 'placeholder_refresh_secret'),
            });
        } catch {
            throw new UnauthorizedException('Invalid refresh token');
        }

        if (payload.purpose !== 'refresh') {
            throw new UnauthorizedException('Invalid token purpose');
        }

        const admin = await this.prisma.admin.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, role: true, isActive: true },
        });

        if (!admin || !admin.isActive) {
            throw new UnauthorizedException('Account disabled');
        }

        return this.issueTokens(admin.id, admin.email, admin.role);
    }

    private async issueTokens(id: string, email: string, role: string) {
        await this.prisma.admin.update({
            where: { id },
            data: { lastLoginAt: new Date() },
        });

        const accessToken = this.jwt.sign(
            { sub: id, email, role },
            { expiresIn: '2h' },
        );

        const refreshToken = this.jwt.sign(
            { sub: id, purpose: 'refresh' },
            {
                secret: this.config.get('JWT_REFRESH_SECRET', 'placeholder_refresh_secret'),
                expiresIn: '7d',
            },
        );

        return { accessToken, refreshToken };
    }
}
