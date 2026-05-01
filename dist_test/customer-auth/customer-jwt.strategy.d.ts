import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
declare const CustomerJwtStrategy_base: new (...args: any[]) => Strategy;
export declare class CustomerJwtStrategy extends CustomerJwtStrategy_base {
    private readonly config;
    private readonly prisma;
    constructor(config: ConfigService, prisma: PrismaService);
    validate(payload: {
        sub: string;
        type: string;
    }): Promise<{
        id: string;
        email: string;
        name: string;
        isActive: boolean;
    } | null>;
}
export {};
