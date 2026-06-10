import { Module } from '@nestjs/common';
import { SavesService } from './saves.service';
import { SavesController } from './saves.controller';
import { PrismaModule } from '../../config/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [SavesService],
  controllers: [SavesController],
  exports: [SavesService],
})
export class SavesModule {}
