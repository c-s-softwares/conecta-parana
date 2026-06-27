import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { Role } from '@prisma/client';
import { LocalsService } from './locals.service';
import { CreateLocalDto } from './dto/request/create-local.dto';
import { UpdateLocalDto } from './dto/request/update-local.dto';
import { NearbyQueryDto } from './dto/request/nearby-query.dto';
import {
  LocalResponseDto,
  LocalNearbyResponseDto,
} from './dto/response/local-response.dto';
import { AdminRoute } from '../../common/decorators/admin-route.decorator';
import { RequireCityScope } from '../../common/decorators/require-city-scope.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { PaginationQueryDto } from '../../common/dto/request/pagination-query.dto';
import { PaginatedResponseDto } from '../../common/dto/response/paginated-response.dto';

@ApiTags('locals')
@Controller('locals')
export class LocalsController {
  constructor(private readonly localsService: LocalsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar locais com paginação e filtros' })
  @ApiResponse({
    status: 200,
    description: 'Lista de locais retornada com sucesso',
  })
  findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResponseDto<LocalResponseDto>> {
    return this.localsService.findAll(query);
  }

  @Get('nearby')
  @Public()
  @ApiOperation({ summary: 'Busca geoespacial de locais mais próximos' })
  @ApiResponse({
    status: 200,
    description:
      'Lista de locais próximos retornada com sucesso, ordenada por distância',
  })
  @ApiResponse({
    status: 400,
    description: 'validation_failed | invalid_coordinates | radius_too_large',
  })
  findNearby(
    @Query() query: NearbyQueryDto,
  ): Promise<{ items: LocalNearbyResponseDto[]; total: number }> {
    return this.localsService.findNearby(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Buscar local por ID com coordenadas e flag de salvo',
    description:
      'Endpoint público com auth opcional. Quando o token JWT é enviado, o campo saved reflete o estado do usuário; sem token, retorna false.',
  })
  @ApiResponse({
    status: 200,
    description: 'Local encontrado com sucesso',
    type: LocalResponseDto,
  })
  @ApiResponse({ status: 404, description: 'local_not_found' })
  findOne(
    @Param('id') id: string,
    @Request() req?: ExpressRequest & { user?: JwtPayload },
  ): Promise<LocalResponseDto> {
    return this.localsService.findOne(id, req?.user?.sub);
  }

  @Post()
  @RequireCityScope()
  @AdminRoute()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar novo local (ADMIN)' })
  @ApiResponse({
    status: 201,
    description: 'Local criado com sucesso',
    type: LocalResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'validation_failed | invalid_coordinates',
  })
  @ApiResponse({ status: 401, description: 'unauthenticated' })
  @ApiResponse({ status: 403, description: 'role_denied | city_scope_denied' })
  create(
    @Body() dto: CreateLocalDto,
    @Request() req: ExpressRequest,
  ): Promise<LocalResponseDto> {
    const user = req['user'] as JwtPayload;
    return this.localsService.create({
      ...dto,
      userId: user.sub,
    });
  }

  @Put(':id')
  @AdminRoute()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar local existente (ADMIN da cidade)' })
  @ApiResponse({
    status: 200,
    description: 'Local atualizado com sucesso',
    type: LocalResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'validation_failed | invalid_coordinates',
  })
  @ApiResponse({ status: 401, description: 'unauthenticated' })
  @ApiResponse({ status: 403, description: 'role_denied | city_scope_denied' })
  @ApiResponse({ status: 404, description: 'local_not_found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateLocalDto,
    @Request() req: ExpressRequest,
  ): Promise<LocalResponseDto> {
    const user = req['user'] as JwtPayload;
    const userCityId =
      user.role === Role.ADMIN ? (user.cityId ?? undefined) : undefined;
    return this.localsService.update(id, dto, userCityId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AdminRoute()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remover local (soft delete, ADMIN da cidade)' })
  @ApiResponse({ status: 204, description: 'Local removido com sucesso' })
  @ApiResponse({ status: 401, description: 'unauthenticated' })
  @ApiResponse({ status: 403, description: 'role_denied | city_scope_denied' })
  @ApiResponse({ status: 404, description: 'local_not_found' })
  async remove(
    @Param('id') id: string,
    @Request() req: ExpressRequest,
  ): Promise<void> {
    const user = req['user'] as JwtPayload;
    const userCityId =
      user.role === Role.ADMIN ? (user.cityId ?? undefined) : undefined;
    return this.localsService.remove(id, userCityId);
  }
}
