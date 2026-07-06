import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';

import { BaseCrudController } from '../../common/controllers/base-crud.controller';
import { AdminRoute } from '../../common/decorators/admin-route.decorator';
import { Public } from '../../common/decorators/public.decorator';

import type { JwtPayload } from '../auth/strategies/jwt.strategy';

import { CommunicateService } from './communicates.service';
import { CreateCommunicateDto } from './dto/request/create-communicate.dto';
import { UpdateCommunicateDto } from './dto/request/update-communicate.dto';
import { QueryComunicadoDto } from './dto/request/query-communicate.dto';
import {
  CommunicateDetailResponse,
  CommunicateResponse,
} from './dto/response/communicate-response.dto';

type AuthRequest = Request & {
  user?: JwtPayload;
};

@ApiTags('communicates')
@Controller('communicates')
export class CommunicateController extends BaseCrudController<
  CommunicateResponse,
  CreateCommunicateDto,
  UpdateCommunicateDto
> {
  constructor(private readonly communicateService: CommunicateService) {
    super(communicateService);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Listar comunicados com paginação' })
  @ApiResponse({ status: 200, description: 'Lista paginada de comunicados' })
  override findAll(@Query() query: QueryComunicadoDto) {
    return this.communicateService.findAll(query);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary:
      'Buscar comunicado por ID com photos, autor e flags de engajamento',
    description:
      'Endpoint público com auth opcional. Quando o token JWT é enviado, os campos liked e saved refletem o estado do usuário; sem token, ambos retornam false.',
  })
  @ApiResponse({
    status: 200,
    description: 'Comunicado encontrado',
    type: CommunicateDetailResponse,
  })
  @ApiResponse({ status: 404, description: 'comunicado_not_found' })
  override findOne(@Param('id') id: string, @Req() req?: AuthRequest) {
    return this.communicateService.findOneDetail(id, req?.user?.sub);
  }

  @Post()
  @AdminRoute()
  @ApiOperation({ summary: 'Criar comunicado (ADMIN)' })
  @ApiResponse({
    status: 201,
    description: 'Comunicado criado com sucesso',
    type: CommunicateResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'validation_failed | city_required',
  })
  @ApiResponse({ status: 401, description: 'unauthenticated' })
  @ApiResponse({ status: 403, description: 'role_denied | city_scope_denied' })
  override create(@Body() dto: CreateCommunicateDto, @Req() req?: AuthRequest) {
    return this.communicateService.create(dto, req?.user);
  }

  @Patch(':id')
  @AdminRoute()
  @ApiOperation({ summary: 'Atualizar comunicado (ADMIN da cidade)' })
  @ApiResponse({
    status: 200,
    description: 'Comunicado atualizado com sucesso',
    type: CommunicateResponse,
  })
  @ApiResponse({ status: 400, description: 'validation_failed' })
  @ApiResponse({ status: 401, description: 'unauthenticated' })
  @ApiResponse({ status: 403, description: 'role_denied | city_scope_denied' })
  @ApiResponse({ status: 404, description: 'comunicado_not_found' })
  override update(
    @Param('id') id: string,
    @Body() dto: UpdateCommunicateDto,
    @Req() req?: AuthRequest,
  ) {
    return this.communicateService.update(id, dto, req?.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @AdminRoute()
  @ApiOperation({
    summary: 'Deletar comunicado (soft delete, ADMIN da cidade)',
  })
  @ApiResponse({ status: 204, description: 'Comunicado deletado com sucesso' })
  @ApiResponse({ status: 401, description: 'unauthenticated' })
  @ApiResponse({ status: 403, description: 'role_denied | city_scope_denied' })
  @ApiResponse({ status: 404, description: 'comunicado_not_found' })
  override remove(@Param('id') id: string, @Req() req?: AuthRequest) {
    return this.communicateService.remove(id, req?.user);
  }
}
