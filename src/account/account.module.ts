import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { PrismaModule } from '../prisma/prisma.module';
import { EncryptionService } from '../common/encryption.service';

@Module({
    imports: [PrismaModule],
    controllers: [AccountController],
    providers: [AccountService, EncryptionService],
})
export class AccountModule { }
