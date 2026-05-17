import { Module } from '@nestjs/common';
import { CidadesService } from './cidades.service';
import { CidadesController } from './cidades.controller';
import { PrismaModule } from '../../config/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CidadesController],
  providers: [CidadesService],
  exports: [CidadesService],
})
export class CidadesModule {}
