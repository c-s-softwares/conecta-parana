import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AppService } from './app.service';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { Roles } from './common/decorators/roles.decorator';
import { Role } from './common/enums/role.enum';

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

  @Get('admin/test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Endpoint de teste — acesso restrito a ADMIN' })
  @ApiResponse({ status: 200, description: 'Acesso permitido para ADMIN' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado — role insuficiente',
  })
  getAdminTest(): { message: string } {
    return { message: 'Acesso admin autorizado com sucesso' };
  }
}
