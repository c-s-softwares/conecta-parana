import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('health')
  @ApiOperation({ summary: 'Health check do serviço' })
  @ApiResponse({ status: 200, description: 'Serviço está operacional' })
  getHealth(): { status: string; timestamp: string; environment: string } {
    return this.appService.getHealth();
  }
}