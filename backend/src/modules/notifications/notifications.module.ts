import { Module } from '@nestjs/common';
import { NotificationService } from './notifications.service';
import { PrismaModule } from '../../config/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [NotificationService],
  exports: [NotificationService],
})
export class NotificationsModule {}
