import { Module } from '@nestjs/common';
import { AutomationService } from './automation.service';
import { EncryptionService } from '../common/encryption.service';

@Module({
    providers: [AutomationService, EncryptionService],
    exports: [AutomationService],
})
export class AutomationModule { }
