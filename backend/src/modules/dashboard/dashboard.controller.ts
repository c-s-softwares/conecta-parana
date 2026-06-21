import { Controller, Get, UseGuards, UseInterceptors } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { DashboardService } from './dashboard.service';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { DashboardMetricsResponseDto } from './dto/response/dashboard-metrics-response.dto';
import { CACHE_TTL_2_MINUTES } from '../../common/constants/cache.constants';

@ApiTags('dashboard')
@UseGuards(SuperAdminGuard)
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CACHE_TTL_2_MINUTES)
  @ApiOperation({ summary: 'Métricas consolidadas do painel (Super Admin)' })
  @ApiResponse({ status: 200, type: DashboardMetricsResponseDto })
  @ApiResponse({ status: 401, description: 'unauthenticated' })
  @ApiResponse({
    status: 403,
    description: 'role_denied | super_admin_required',
  })
  getMetrics(): Promise<DashboardMetricsResponseDto> {
    return this.dashboardService.getMetrics();
  }
}
