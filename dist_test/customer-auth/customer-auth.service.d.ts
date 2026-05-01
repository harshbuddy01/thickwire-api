import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
export declare class CustomerAuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly config;
    private readonly email;
    private readonly logger;
    constructor(prisma: PrismaService, jwt: JwtService, config: ConfigService, email: EmailService);
    signup(dto: {
        name: string;
        email: string;
        password: string;
        phone?: string;
        whatsappOptedIn?: boolean;
    }): Promise<{
        message: string;
    }>;
    verifyEmail(token: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresAt: Date;
        message: string;
    }>;
    login(email: string, password: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresAt: Date;
    }>;
    handleGoogleUser(profile: {
        googleId: string;
        email: string;
        name: string;
        avatarUrl?: string;
    }): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresAt: Date;
    }>;
    refresh(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
        expiresAt: Date;
    }>;
    logout(refreshToken: string): Promise<void>;
    forgotPassword(email: string): Promise<{
        message: string;
    }>;
    resetPassword(token: string, newPassword: string): Promise<{
        message: string;
    }>;
    getProfile(customerId: string): Promise<{
        hasPassword: boolean;
        id: string;
        email: string;
        name: string;
        createdAt: Date;
        googleId: string | null;
        avatarUrl: string | null;
        phone: string | null;
        whatsappOptedIn: boolean;
        isVerified: boolean;
    }>;
    updateProfile(customerId: string, dto: {
        name?: string;
        phone?: string;
        whatsappOptedIn?: boolean;
    }): Promise<{
        id: string;
        email: string;
        name: string;
        phone: string | null;
        whatsappOptedIn: boolean;
    }>;
    private issueTokens;
    private linkGuestOrders;
}
