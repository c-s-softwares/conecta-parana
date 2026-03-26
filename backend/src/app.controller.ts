import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(30_000) // 30 segundos
  @ApiOperation({ summary: 'Health check do serviço (cached 30s)' })
  @ApiResponse({ status: 200, description: 'Serviço está operacional' })
  getHealth(): { status: string; timestamp: string; environment: string } {
    return this.appService.getHealth();
  }
}
