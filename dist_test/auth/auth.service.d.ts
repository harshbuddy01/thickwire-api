import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    private readonly logger;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService);
    login(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
    } | {
        requiresTOTP: boolean;
        preAuthToken: string;
    }>;
    verifyTotp(preAuthToken: string, totpCode: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    setupTotp(adminId: string): Promise<{
        secret: string;
        qrCode: string;
    }>;
    enableTotp(adminId: string, totpCode: string): Promise<{
        enabled: boolean;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    private issueTokens;
}
