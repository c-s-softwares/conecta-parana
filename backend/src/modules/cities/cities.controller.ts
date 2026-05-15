import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  Inject,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  CacheInterceptor,
  CacheTTL,
  CACHE_MANAGER,
} from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { CitiesService } from './cities.service';
import { CityResponse } from './dto/response/city-response.dto';
import { CreateCityDto } from './dto/request/create-city.dto';
import { UpdateCityDto } from './dto/request/update-city.dto';
import { FindCitiesQueryDto } from './dto/request/find-cities-query.dto';
import { CACHE_TTL_1_HOUR } from '../../common/constants/cache.constants';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { BaseCrudController } from '../../common/controllers/base-crud.controller';

@ApiTags('cities')
@Controller('cities')
export class CitiesController extends BaseCrudController<
  CityResponse,
  CreateCityDto,
  UpdateCityDto
> {
  constructor(
    private readonly citiesService: CitiesService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super(citiesService);
  }

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CACHE_TTL_1_HOUR)
  @ApiOperation({ summary: 'Listar cidades com paginação' })
  @ApiResponse({ status: 200, description: 'Lista paginada de cidades' })
  override findAll(@Query() query: FindCitiesQueryDto) {
    return super.findAll(query);
  }

  @Get(':id')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(CACHE_TTL_1_HOUR)
  @ApiOperation({ summary: 'Buscar cidade por ID' })
  @ApiResponse({ status: 200, description: 'Cidade encontrada' })
  @ApiResponse({ status: 404, description: 'Cidade não encontrada' })
  override findOne(@Param('id') id: string) {
    return super.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar cidade' })
  @ApiResponse({ status: 201, description: 'Cidade criada com sucesso' })
  @ApiResponse({ status: 409, description: 'Cidade já existe' })
  async create(@Body() dto: CreateCityDto) {
    const result = await super.create(dto);
    await this.clearCache();
    return result;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar cidade' })
  @ApiResponse({ status: 200, description: 'Cidade atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Cidade não encontrada' })
  async update(@Param('id') id: string, @Body() dto: UpdateCityDto) {
    const result = await super.update(id, dto);
    await this.clearCache();
    return result;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar cidade' })
  @ApiResponse({ status: 204, description: 'Cidade deletada com sucesso' })
  @ApiResponse({ status: 409, description: 'Cidade possui conteúdo associado' })
  async remove(@Param('id') id: string) {
    const result = await super.remove(id);
    await this.clearCache();
    return result;
  }
  private async clearCache() {
    await this.cacheManager.del('/cities');
  }
}
