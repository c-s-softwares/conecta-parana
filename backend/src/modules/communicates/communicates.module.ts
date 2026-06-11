import { Module } from '@nestjs/common';
import { CommunicateController } from './communicates.controller';
import { CommunicateService } from './communicates.service';

@Module({
  controllers: [CommunicateController],
  providers: [CommunicateService],
  exports: [CommunicateService],
})
export class CommunicateModule {}