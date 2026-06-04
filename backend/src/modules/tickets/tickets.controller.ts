import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Request,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { Role } from '@prisma/client';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/request/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/request/update-ticket-status.dto';
import { CreateTicketCommentDto } from './dto/request/create-ticket-comment.dto';
import { TicketResponseDto } from './dto/response/ticket-response.dto';
import { TicketCommentResponseDto } from './dto/response/ticket-comment-response.dto';
import { TicketDetailResponseDto } from './dto/response/ticket-detail-response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRoute } from '../../common/decorators/admin-route.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('tickets')
@Controller('tickets')
@ApiBearerAuth()
export class TicketsController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Get('me')
  @Roles(Role.CIDADAO)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Listar chamados do próprio cidadão' })
  @ApiResponse({
    status: 200,
    description: 'Lista de chamados retornada com sucesso',
    type: [TicketResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado: requer role CIDADAO',
  })
  async findMyTickets(
    @Request() req: ExpressRequest,
  ): Promise<TicketResponseDto[]> {
    const user = req['user'] as JwtPayload;
    return this.ticketsService.findAllForUser(user.sub);
  }

  @Get()
  @AdminRoute()
  @ApiOperation({ summary: 'Listar chamados da cidade do admin' })
  @ApiResponse({
    status: 200,
    description: 'Lista de chamados da cidade retornada com sucesso',
    type: [TicketResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado: requer role ADMIN' })
  async findCityTickets(
    @Request() req: ExpressRequest,
  ): Promise<TicketResponseDto[]> {
    const user = req['user'] as JwtPayload;
    return this.ticketsService.findAllForAdmin(user.cityId ?? null);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Visualizar detalhe de um chamado' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes do chamado retornados com sucesso',
    type: TicketDetailResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado: não é o dono ou administrador da cidade',
  })
  @ApiResponse({ status: 404, description: 'Chamado não encontrado' })
  async findOne(
    @Param('id') id: string,
    @Request() req: ExpressRequest,
  ): Promise<TicketDetailResponseDto> {
    const user = req['user'] as JwtPayload;
    return this.ticketsService.findOne(id, user);
  }

  @Post()
  @Roles(Role.CIDADAO)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Criar um novo chamado (Cidadão)' })
  @ApiResponse({
    status: 201,
    description: 'Chamado criado com sucesso',
    type: TicketResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação ou cidadão sem cidade',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado: requer role CIDADAO',
  })
  async create(
    @Body() dto: CreateTicketDto,
    @Request() req: ExpressRequest,
  ): Promise<TicketResponseDto> {
    const user = req['user'] as JwtPayload;
    return this.ticketsService.create(dto, user.sub);
  }

  @Put(':id/status')
  @AdminRoute()
  @ApiOperation({ summary: 'Mudar o status de um chamado (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Status do chamado atualizado com sucesso',
    type: TicketResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação ou transição de status inválida',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado: administrador em outra cidade',
  })
  @ApiResponse({ status: 404, description: 'Chamado não encontrado' })
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateTicketStatusDto,
    @Request() req: ExpressRequest,
  ): Promise<TicketResponseDto> {
    const user = req['user'] as JwtPayload;
    return this.ticketsService.updateStatus(
      id,
      dto,
      user.sub,
      user.cityId ?? null,
    );
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Adicionar comentário ao chamado' })
  @ApiResponse({
    status: 201,
    description: 'Comentário adicionado com sucesso',
    type: TicketCommentResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado: não é o dono ou administrador da cidade',
  })
  @ApiResponse({ status: 404, description: 'Chamado não encontrado' })
  async addComment(
    @Param('id') id: string,
    @Body() dto: CreateTicketCommentDto,
    @Request() req: ExpressRequest,
  ): Promise<TicketCommentResponseDto> {
    const user = req['user'] as JwtPayload;
    return this.ticketsService.addComment(
      id,
      dto,
      user.sub,
      user.role,
      user.cityId ?? null,
    );
  }
}
