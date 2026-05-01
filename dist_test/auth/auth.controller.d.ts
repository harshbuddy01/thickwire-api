import { Request, Response } from 'express';
import { AuthService } from './auth.service';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    login(email: string, password: string, res: Response): Promise<{
        requiresTOTP: boolean;
        preAuthToken: string;
    } | {
        accessToken: string;
    }>;
    verifyTotp(preAuthToken: string, code: string, res: Response): Promise<{
        accessToken: string;
    }>;
    refresh(req: Request, res: Response): Promise<{
        error: string;
        accessToken?: undefined;
    } | {
        accessToken: string;
        error?: undefined;
    }>;
    logout(res: Response): Promise<{
        message: string;
    }>;
    setupTotp(req: Request): Promise<{
        secret: string;
        qrCode: string;
    }>;
    enableTotp(req: Request, code: string): Promise<{
        enabled: boolean;
    }>;
    private setRefreshCookie;
}
