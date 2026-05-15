import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CidadesService } from './cidades.service';
import { CidadeResponse } from './dto/response/cidade-response.dto';
import { CreateCidadeDto } from './dto/request/create-cidade.dto';
import { UpdateCidadeDto } from './dto/request/update-cidade.dto';
import { PaginationQueryDto } from '../../common/dto/request/pagination-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { BaseCrudController } from '../../common/controllers/base-crud.controller';

@ApiTags('cidades')
@Controller('cidades')
export class CidadesController extends BaseCrudController<
  CidadeResponse,
  CreateCidadeDto,
  UpdateCidadeDto
> {
  constructor(private readonly cidadesService: CidadesService) {
    super(cidadesService);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cidades com paginação' })
  @ApiResponse({ status: 200, description: 'Lista paginada de cidades' })
  override findAll(@Query() query: PaginationQueryDto) {
    return super.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar cidade por ID' })
  @ApiResponse({ status: 200, description: 'Cidade encontrada' })
  @ApiResponse({ status: 404, description: 'Cidade não encontrada' })
  override findOne(@Param('id') id: string) {
    return super.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar cidade' })
  @ApiResponse({ status: 201, description: 'Cidade criada com sucesso' })
  @ApiResponse({ status: 409, description: 'Cidade já existe' })
  override create(@Body() dto: CreateCidadeDto) {
    return super.create(dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar cidade' })
  @ApiResponse({ status: 200, description: 'Cidade atualizada com sucesso' })
  @ApiResponse({ status: 404, description: 'Cidade não encontrada' })
  override update(@Param('id') id: string, @Body() dto: UpdateCidadeDto) {
    return super.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar cidade' })
  @ApiResponse({ status: 204, description: 'Cidade deletada com sucesso' })
  override remove(@Param('id') id: string) {
    return super.remove(id);
  }
}
