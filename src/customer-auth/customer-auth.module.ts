import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CustomerAuthController } from './customer-auth.controller';
import { CustomerAuthService } from './customer-auth.service';
import { CustomerJwtStrategy } from './customer-jwt.strategy';
import { GoogleStrategy } from './google.strategy';
import { PrismaModule } from '../prisma/prisma.module';
import { EmailModule } from '../email/email.module';

@Module({
    imports: [
        PrismaModule,
        EmailModule,
        PassportModule.register({ defaultStrategy: 'customer-jwt' }),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: config.get('CUSTOMER_JWT_SECRET', 'customer-jwt-default-secret'),
                signOptions: { expiresIn: '2h' },
            }),
        }),
    ],
    controllers: [CustomerAuthController],
    providers: [CustomerAuthService, CustomerJwtStrategy, GoogleStrategy],
    exports: [CustomerAuthService],
})
export class CustomerAuthModule { }
