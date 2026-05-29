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
import { SuggestionsService } from './suggestions.service';
import { CreateSuggestionDto } from './dto/request/create-suggestion.dto';
import { RespondSuggestionDto } from './dto/request/respond-suggestion.dto';
import { SuggestionResponseDto } from './dto/response/suggestion-response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { AdminRoute } from '../../common/decorators/admin-route.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('suggestions')
@Controller('suggestions')
@ApiBearerAuth()
export class SuggestionsController {
  constructor(private readonly suggestionsService: SuggestionsService) {}

  @Get('me')
  @Roles(Role.CIDADAO)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Listar sugestões do próprio cidadão' })
  @ApiResponse({
    status: 200,
    description: 'Lista de sugestões retornada com sucesso',
    type: [SuggestionResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado: requer role CIDADAO',
  })
  async findMySuggestions(
    @Request() req: ExpressRequest,
  ): Promise<SuggestionResponseDto[]> {
    const user = req['user'] as JwtPayload;
    return this.suggestionsService.findAllForUser(user.sub);
  }

  @Get()
  @AdminRoute()
  @ApiOperation({ summary: 'Listar sugestões da cidade do admin' })
  @ApiResponse({
    status: 200,
    description: 'Lista de sugestões da cidade retornada com sucesso',
    type: [SuggestionResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({ status: 403, description: 'Acesso negado: requer role ADMIN' })
  async findCitySuggestions(
    @Request() req: ExpressRequest,
  ): Promise<SuggestionResponseDto[]> {
    const user = req['user'] as JwtPayload;
    return this.suggestionsService.findAllForAdmin(user.cityId ?? null);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Visualizar detalhe de uma sugestão' })
  @ApiResponse({
    status: 200,
    description: 'Detalhes da sugestão retornados com sucesso',
    type: SuggestionResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado: não é o dono ou administrador da cidade',
  })
  @ApiResponse({ status: 404, description: 'Sugestão não encontrada' })
  async findOne(
    @Param('id') id: string,
    @Request() req: ExpressRequest,
  ): Promise<SuggestionResponseDto> {
    const user = req['user'] as JwtPayload;
    return this.suggestionsService.findOne(id, user);
  }

  @Post()
  @Roles(Role.CIDADAO)
  @UseGuards(RolesGuard)
  @ApiOperation({ summary: 'Criar uma nova sugestão (Cidadão)' })
  @ApiResponse({
    status: 201,
    description: 'Sugestão criada com sucesso',
    type: SuggestionResponseDto,
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
    @Body() dto: CreateSuggestionDto,
    @Request() req: ExpressRequest,
  ): Promise<SuggestionResponseDto> {
    const user = req['user'] as JwtPayload;
    return this.suggestionsService.create(dto, user.sub);
  }

  @Put(':id/respond')
  @AdminRoute()
  @ApiOperation({ summary: 'Responder a uma sugestão (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Sugestão respondida com sucesso',
    type: SuggestionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação ou transição inválida',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado: administrador em outra cidade',
  })
  @ApiResponse({ status: 404, description: 'Sugestão não encontrada' })
  async respond(
    @Param('id') id: string,
    @Body() dto: RespondSuggestionDto,
    @Request() req: ExpressRequest,
  ): Promise<SuggestionResponseDto> {
    const user = req['user'] as JwtPayload;
    return this.suggestionsService.respond(
      id,
      dto,
      user.sub,
      user.cityId ?? null,
    );
  }

  @Put(':id/conclude')
  @AdminRoute()
  @ApiOperation({ summary: 'Concluir uma sugestão (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Sugestão concluída com sucesso',
    type: SuggestionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação ou transição inválida',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado: administrador em outra cidade',
  })
  @ApiResponse({ status: 404, description: 'Sugestão não encontrada' })
  async conclude(
    @Param('id') id: string,
    @Body() dto: RespondSuggestionDto,
    @Request() req: ExpressRequest,
  ): Promise<SuggestionResponseDto> {
    const user = req['user'] as JwtPayload;
    return this.suggestionsService.conclude(
      id,
      dto,
      user.sub,
      user.cityId ?? null,
    );
  }

  @Put(':id/archive')
  @AdminRoute()
  @ApiOperation({ summary: 'Arquivar uma sugestão (Admin)' })
  @ApiResponse({
    status: 200,
    description: 'Sugestão arquivada com sucesso',
    type: SuggestionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação ou transição inválida',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado: administrador em outra cidade',
  })
  @ApiResponse({ status: 404, description: 'Sugestão não encontrada' })
  async archive(
    @Param('id') id: string,
    @Body() dto: RespondSuggestionDto,
    @Request() req: ExpressRequest,
  ): Promise<SuggestionResponseDto> {
    const user = req['user'] as JwtPayload;
    return this.suggestionsService.archive(
      id,
      dto,
      user.sub,
      user.cityId ?? null,
    );
  }
}
