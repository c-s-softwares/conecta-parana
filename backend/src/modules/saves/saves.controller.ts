import {
  Controller,
  Post,
  Get,
  Body,
  Request,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { Role } from '@prisma/client';
import { SavesService } from './saves.service';
import { CreateSaveToggleDto } from './dto/request/create-save-toggle.dto';
import { SaveToggleResponseDto } from './dto/response/save-toggle-response.dto';
import { SavesGroupedResponseDto } from './dto/response/saves-grouped-response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

@ApiTags('saves')
@Controller('saves')
@ApiBearerAuth()
export class SavesController {
  constructor(private readonly savesService: SavesService) {}

  @Post('toggle')
  @HttpCode(200)
  @Roles(Role.CIDADAO)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary:
      'Salvar ou remover de salvos um recurso (Evento, Comunicado, Notícia, Local)',
  })
  @ApiResponse({
    status: 200,
    description: 'Toggle de save efetuado com sucesso',
    type: SaveToggleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Target inválido, nulo ou múltiplos targets informados',
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado: requer papel CIDADAO',
  })
  @ApiResponse({ status: 404, description: 'Recurso alvo não encontrado' })
  async toggleSave(
    @Body() dto: CreateSaveToggleDto,
    @Request() req: ExpressRequest,
  ): Promise<SaveToggleResponseDto> {
    const user = req['user'] as JwtPayload;
    return this.savesService.toggleSave(dto, user.sub);
  }

  @Get('me')
  @Roles(Role.CIDADAO)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Listar recursos salvos pelo cidadão logado, agrupados por tipo',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de recursos salvos retornada com sucesso',
    type: SavesGroupedResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Não autenticado' })
  @ApiResponse({
    status: 403,
    description: 'Acesso negado: requer papel CIDADAO',
  })
  async findMySaves(
    @Request() req: ExpressRequest,
  ): Promise<SavesGroupedResponseDto> {
    const user = req['user'] as JwtPayload;
    return this.savesService.findMySaves(user.sub);
  }
}
