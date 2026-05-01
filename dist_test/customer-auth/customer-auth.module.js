"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustomerAuthModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const passport_1 = require("@nestjs/passport");
const config_1 = require("@nestjs/config");
const customer_auth_controller_1 = require("./customer-auth.controller");
const customer_auth_service_1 = require("./customer-auth.service");
const customer_jwt_strategy_1 = require("./customer-jwt.strategy");
const google_strategy_1 = require("./google.strategy");
const prisma_module_1 = require("../prisma/prisma.module");
const email_module_1 = require("../email/email.module");
let CustomerAuthModule = class CustomerAuthModule {
};
exports.CustomerAuthModule = CustomerAuthModule;
exports.CustomerAuthModule = CustomerAuthModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            email_module_1.EmailModule,
            passport_1.PassportModule.register({ defaultStrategy: 'customer-jwt' }),
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    secret: config.get('CUSTOMER_JWT_SECRET', 'customer-jwt-default-secret'),
                    signOptions: { expiresIn: '2h' },
                }),
            }),
        ],
        controllers: [customer_auth_controller_1.CustomerAuthController],
        providers: [customer_auth_service_1.CustomerAuthService, customer_jwt_strategy_1.CustomerJwtStrategy, google_strategy_1.GoogleStrategy],
        exports: [customer_auth_service_1.CustomerAuthService],
    })
], CustomerAuthModule);
//# sourceMappingURL=customer-auth.module.js.map