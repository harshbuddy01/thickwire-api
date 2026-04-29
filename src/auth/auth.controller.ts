import {
    Controller,
    Post,
    Body,
    Req,
    Res,
    UseGuards,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(
        @Body('email') email: string,
        @Body('password') password: string,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.login(email, password);
        if ('requiresTOTP' in result) {
            return result; // { requiresTOTP: true, preAuthToken }
        }
        this.setRefreshCookie(res, result.refreshToken);
        return { accessToken: result.accessToken };
    }

    @Post('verify-totp')
    @HttpCode(HttpStatus.OK)
    async verifyTotp(
        @Body('preAuthToken') preAuthToken: string,
        @Body('code') code: string,
        @Res({ passthrough: true }) res: Response,
    ) {
        const result = await this.authService.verifyTotp(preAuthToken, code);
        this.setRefreshCookie(res, result.refreshToken);
        return { accessToken: result.accessToken };
    }

    @Post('refresh')
    @HttpCode(HttpStatus.OK)
    async refresh(
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ) {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) {
            return { error: 'No refresh token' };
        }
        const result = await this.authService.refresh(refreshToken);
        this.setRefreshCookie(res, result.refreshToken);
        return { accessToken: result.accessToken };
    }

    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Res({ passthrough: true }) res: Response) {
        res.clearCookie('refreshToken');
        return { message: 'Logged out' };
    }

    @Post('setup-totp')
    @UseGuards(JwtAuthGuard)
    async setupTotp(@Req() req: Request) {
        return this.authService.setupTotp((req.user as any).id);
    }

    @Post('enable-totp')
    @UseGuards(JwtAuthGuard)
    async enableTotp(@Req() req: Request, @Body('code') code: string) {
        return this.authService.enableTotp((req.user as any).id, code);
    }

    private setRefreshCookie(res: Response, token: string) {
        res.cookie('refreshToken', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            path: '/',
        });
    }
}
