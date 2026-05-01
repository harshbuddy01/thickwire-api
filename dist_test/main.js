"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const express = require("express");
const cookieParser = require("cookie-parser");
const helmet_1 = require("helmet");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        rawBody: true,
    });
    const configService = app.get(config_1.ConfigService);
    app.use((0, helmet_1.default)());
    app.use(cookieParser());
    app.enableCors({
        origin: [
            configService.get('FRONTEND_URL', 'http://localhost:3000'),
            configService.get('ADMIN_URL', 'http://localhost:3002'),
            'https://admin.streamkart.store',
            'https://streamkart.store',
            'https://www.streamkart.store',
        ],
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    app.setGlobalPrefix('api/v1');
    app.use('/api/v1/orders/webhook', express.raw({ type: 'application/json' }));
    const port = configService.get('PORT', 3001);
    await app.listen(port);
    console.log(`🚀 ThickWire API running on port ${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map