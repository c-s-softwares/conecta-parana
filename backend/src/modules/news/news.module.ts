import { Module } from '@nestjs/common';

import { PrismaModule } from '../../config/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { UploadsModule } from '../uploads/uploads.module';

import { NewsController } from './news.controller';
import { NewsService } from './news.service';

@Module({
  imports: [PrismaModule, AuthModule, UploadsModule],
  controllers: [NewsController],
  providers: [NewsService],
  exports: [],
})
export class NewsModule {}
