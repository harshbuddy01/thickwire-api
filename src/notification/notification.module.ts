import { Global, Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { WhatsappModule } from '../whatsapp/whatsapp.module';

@Global()
@Module({
    imports: [WhatsappModule],
    providers: [NotificationService],
    exports: [NotificationService],
})
export class NotificationModule { }
