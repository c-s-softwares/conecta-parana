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
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Request } from 'express';

import { BaseCrudController } from '../../common/controllers/base-crud.controller';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

import { CommunicateService } from './communicates.service';
import { CreateCommunicateDto } from './dto/request/create-communicate.dto';
import { UpdateCommunicateDto } from './dto/request/update-communicate.dto';
import { QueryComunicadoDto } from './dto/request/query-communicate.dto';
import { CommunicateResponse } from './dto/response/communicate-response.dto';

type AuthRequest = Request & {
  user: {
    id: string;
    cityId?: string | null;
    role: Role;
  };
};

@ApiTags('comunicados')
@Controller('comunicados')
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
  @ApiOperation({ summary: 'Buscar comunicado por ID' })
  @ApiResponse({ status: 200, description: 'Comunicado encontrado' })
  @ApiResponse({ status: 404, description: 'Comunicado não encontrado' })
  override findOne(@Param('id') id: string) {
    return super.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar comunicado' })
  @ApiResponse({ status: 201, description: 'Comunicado criado com sucesso' })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou cidade obrigatória',
  })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  CreateCommunicate(
    @Body() dto: CreateCommunicateDto,
    @Req() req: AuthRequest,
  ) {
    return this.communicateService.createWithUser(dto, req.user);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar comunicado' })
  @ApiResponse({
    status: 200,
    description: 'Comunicado atualizado com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Comunicado não encontrado' })
  UpdateCommunicate(
    @Param('id') id: string,
    @Body() dto: UpdateCommunicateDto,
    @Req() req: AuthRequest,
  ) {
    return this.communicateService.updateWithUser(id, dto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar comunicado' })
  @ApiResponse({ status: 204, description: 'Comunicado deletado com sucesso' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  @ApiResponse({ status: 404, description: 'Comunicado não encontrado' })
  removeCommunicate(@Param('id') id: string, @Req() req: AuthRequest) {
    return this.communicateService.removeWithUser(id, req.user);
  }
}
