import { CustomerAuthService } from './customer-auth.service';
import { Response, Request } from 'express';
export declare class CustomerAuthController {
    private readonly authService;
    constructor(authService: CustomerAuthService);
    signup(body: {
        name: string;
        email: string;
        password: string;
        phone?: string;
        whatsappOptedIn?: boolean;
    }): Promise<{
        message: string;
    }>;
    verifyEmail(body: {
        token: string;
    }, res: Response): Promise<{
        message: string;
        accessToken: string;
    }>;
    login(body: {
        email: string;
        password: string;
    }, res: Response): Promise<{
        accessToken: string;
    }>;
    googleLogin(): void;
    googleCallback(req: any, res: Response): Promise<void>;
    refresh(req: Request, res: Response): Promise<{
        accessToken: string;
    }>;
    logout(req: Request, res: Response): Promise<{
        message: string;
    }>;
    forgotPassword(body: {
        email: string;
    }): Promise<{
        message: string;
    }>;
    resetPassword(body: {
        token: string;
        password: string;
    }): Promise<{
        message: string;
    }>;
    getProfile(req: any): Promise<{
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
    updateProfile(req: any, body: {
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
    private setRefreshCookie;
}
