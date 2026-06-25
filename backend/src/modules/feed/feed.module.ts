import { Module } from '@nestjs/common';

import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { PrismaModule } from '../../config/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FeedController],
  providers: [FeedService],
})
export class FeedModule {}
