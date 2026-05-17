import {
  Controller,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { CitiesService } from './cities.service';
import { CityResponse } from './dto/response/city-response.dto';
import { CreateCityDto } from './dto/request/create-city.dto';
import { UpdateCityDto } from './dto/request/update-city.dto';
import { CACHE_TTL_1_HOUR } from '../../common/constants/cache.constants';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { BaseCrudController } from '../../common/controllers/base-crud.controller';

@ApiTags('cities')
@UseInterceptors(CacheInterceptor)
@CacheTTL(CACHE_TTL_1_HOUR)
@Controller('cities')
export class CitiesController extends BaseCrudController<
  CityResponse,
  CreateCityDto,
  UpdateCityDto
> {
  constructor(private readonly citiesService: CitiesService) {
    super(citiesService);
  }

  @Post()
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar cidade' })
  @ApiResponse({ status: 201, description: 'Cidade criada com sucesso' })
  @ApiResponse({ status: 409, description: 'Cidade já existe' })
  override create(@Body() dto: CreateCityDto) {
    return super.create(dto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar cidade' })
  @ApiResponse({ status: 200, description: 'Cidade atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Cidade não encontrada' })
  override update(@Param('id') id: string, @Body() dto: UpdateCityDto) {
    return super.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar cidade' })
  @ApiResponse({ status: 204, description: 'Cidade deletada com sucesso' })
  @ApiResponse({ status: 409, description: 'Cidade possui conteúdo associado' })
  override remove(@Param('id') id: string) {
    return super.remove(id);
  }
}
