import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor(private readonly config: ConfigService) {
        super({
            clientID: config.get('GOOGLE_CLIENT_ID', 'not-configured'),
            clientSecret: config.get('GOOGLE_CLIENT_SECRET', 'not-configured'),
            callbackURL: config.get('GOOGLE_CALLBACK_URL', 'http://localhost:3001/api/v1/auth/google/callback'),
            scope: ['email', 'profile'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
    ) {
        const user = {
            googleId: profile.id,
            email: profile.emails?.[0]?.value || '',
            name: profile.displayName || '',
            avatarUrl: profile.photos?.[0]?.value || null,
        };

        done(null, user);
    }
}
