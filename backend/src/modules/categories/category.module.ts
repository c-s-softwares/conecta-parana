import { Module } from '@nestjs/common';

import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';

import { PrismaModule } from '../../config/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [],
})
export class CategoryModule {}