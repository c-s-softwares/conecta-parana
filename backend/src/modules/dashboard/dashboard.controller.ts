import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
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
import { DashboardChartResponseDto } from './dto/response/dashboard-chart-response.dto';
import { QueryChartDto } from './dto/request/query-chart.dto';
import {
  CACHE_TTL_1_HOUR,
  CACHE_TTL_2_MINUTES,
} from '../../common/constants/cache.constants';

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

  @Get('chart')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CACHE_TTL_1_HOUR)
  @ApiOperation({ summary: 'Gráfico de publicações por período (Super Admin)' })
  @ApiResponse({ status: 200, type: DashboardChartResponseDto })
  @ApiResponse({ status: 401, description: 'unauthenticated' })
  @ApiResponse({
    status: 403,
    description: 'role_denied | super_admin_required',
  })
  getChart(@Query() query: QueryChartDto): Promise<DashboardChartResponseDto> {
    return this.dashboardService.getChart(query.period);
  }
}
