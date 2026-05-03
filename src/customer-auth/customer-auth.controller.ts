import { Controller, Post, Get, Patch, Body, Query, Req, Res, UseGuards, HttpCode } from '@nestjs/common';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerJwtGuard } from './customer-jwt.guard';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';

@Controller('auth')
export class CustomerAuthController {
    constructor(private readonly authService: CustomerAuthService) { }

    @Post('signup')
    async signup(@Body() body: { name: string; email: string; password: string; phone?: string; whatsappOptedIn?: boolean }) {
        return this.authService.signup(body);
    }

    @Post('verify-email')
    @HttpCode(200)
    async verifyEmail(@Body() body: { token: string }, @Res({ passthrough: true }) res: Response) {
        const result = await this.authService.verifyEmail(body.token);
        this.setRefreshCookie(res, result.refreshToken, result.expiresAt);
        return { message: result.message, accessToken: result.accessToken };
    }

    @Post('login')
    @HttpCode(200)
    async login(@Body() body: { email: string; password: string }, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const ip = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const result = await this.authService.login(body.email, body.password, { ip, userAgent });
        this.setRefreshCookie(res, result.refreshToken, result.expiresAt);
        return { accessToken: result.accessToken };
    }

    @Get('google')
    @UseGuards(AuthGuard('google'))
    googleLogin() {
        // Passport redirects to Google
    }

    @Get('google/callback')
    @UseGuards(AuthGuard('google'))
    async googleCallback(@Req() req: any, @Res() res: Response) {
        const ip = req.ip || (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
        const userAgent = req.headers['user-agent'];
        const result = await this.authService.handleGoogleUser(req.user, { ip, userAgent });
        this.setRefreshCookie(res, result.refreshToken, result.expiresAt);

        // Read redirect state from Google OAuth flow
        const state = req.query.state as string;
        const redirectTo = state ? decodeURIComponent(state) : '/account';

        // Redirect to storefront with short-lived exchange token
        const storefrontUrl = (process.env.STOREFRONT_URL || 'http://localhost:3000').trim();
        res.redirect(`${storefrontUrl}/auth/callback?token=${result.accessToken}&redirect=${encodeURIComponent(redirectTo)}`);
    }

    @Post('refresh')
    @HttpCode(200)
    async refresh(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies?.refreshToken;
        if (!refreshToken) throw new Error('No refresh token');

        const result = await this.authService.refresh(refreshToken);
        this.setRefreshCookie(res, result.refreshToken, result.expiresAt);
        return { accessToken: result.accessToken };
    }

    @Post('logout')
    @HttpCode(200)
    async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const refreshToken = req.cookies?.refreshToken;
        if (refreshToken) await this.authService.logout(refreshToken);
        res.clearCookie('refreshToken');
        return { message: 'Logged out' };
    }

    @Post('forgot-password')
    @HttpCode(200)
    async forgotPassword(@Body() body: { email: string }) {
        return this.authService.forgotPassword(body.email);
    }

    @Post('reset-password')
    @HttpCode(200)
    async resetPassword(@Body() body: { token: string; password: string }) {
        return this.authService.resetPassword(body.token, body.password);
    }

    @Get('me')
    @UseGuards(CustomerJwtGuard)
    async getProfile(@Req() req: any) {
        return this.authService.getProfile(req.user.id);
    }

    @Patch('me')
    @UseGuards(CustomerJwtGuard)
    async updateProfile(@Req() req: any, @Body() body: { name?: string; phone?: string; whatsappOptedIn?: boolean }) {
        return this.authService.updateProfile(req.user.id, body);
    }

    // ── Cookie Helper ──────────────────────────────────
    private setRefreshCookie(res: Response, token: string, expiresAt: Date) {
        res.cookie('refreshToken', token, {
            httpOnly: true,
            secure: true,
            sameSite: 'none',
            expires: expiresAt,
            path: '/',
        });
    }
}
