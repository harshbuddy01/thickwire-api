import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CustomerJwtStrategy extends PassportStrategy(Strategy, 'customer-jwt') {
    constructor(
        private readonly config: ConfigService,
        private readonly prisma: PrismaService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: config.get('CUSTOMER_JWT_SECRET', 'customer-jwt-default-secret'),
        });
    }

    async validate(payload: { sub: string; type: string }) {
        if (payload.type !== 'customer') return null;

        const customer = await this.prisma.customerAccount.findUnique({
            where: { id: payload.sub },
            select: { id: true, email: true, name: true, isActive: true },
        });

        if (!customer || !customer.isActive) return null;
        return customer;
    }
}
