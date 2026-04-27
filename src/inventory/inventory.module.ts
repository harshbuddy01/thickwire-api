import { Module } from '@nestjs/common';
import { InventoryController } from './inventory.controller';
import { InventoryService } from './inventory.service';
import { EncryptionService } from '../common/encryption.service';

@Module({
    controllers: [InventoryController],
    providers: [InventoryService, EncryptionService],
    exports: [InventoryService],
})
export class InventoryModule { }
