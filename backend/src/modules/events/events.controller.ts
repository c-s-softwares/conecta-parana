import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
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

import { EventsService } from './events.service';

import { Roles } from '../../common/decorators/roles.decorator';
import { RequireCityScope } from '../../common/decorators/require-city-scope.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';

import { JwtPayload } from '../auth/strategies/jwt.strategy';

import { CreateEventDto } from './dto/request/create-event.dto';
import { UpdateEventDto } from './dto/request/update-event.dto';
import { QueryEventsDto } from './dto/request/query-events.dto';
import {
  EventDetailResponse,
  EventResponse,
} from './dto/response/event-response.dto';
import { Public } from '../../common/decorators/public.decorator';

type RequestWithUser = Request & {
  user: JwtPayload;
};

type OptionalAuthRequest = Request & {
  user?: JwtPayload;
};

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar eventos com filtros e paginação' })
  @ApiResponse({ status: 200, description: 'Lista paginada de eventos' })
  @ApiResponse({
    status: 400,
    description: 'invalid_event_type | invalid_status',
  })
  findAll(@Query() query: QueryEventsDto) {
    return this.eventsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar evento por ID com flags de engajamento',
    description:
      'Endpoint público com auth opcional. Quando o token JWT é enviado, os campos liked e saved refletem o estado do usuário; sem token, ambos retornam false.',
  })
  @ApiResponse({
    status: 200,
    description: 'Evento encontrado',
    type: EventDetailResponse,
  })
  @ApiResponse({ status: 404, description: 'event_not_found' })
  findOne(@Param('id') id: string, @Req() req?: OptionalAuthRequest) {
    return this.eventsService.findOneDetail(id, req?.user?.sub);
  }

  @Post()
  @UseGuards(RolesGuard)
  @RequireCityScope()
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar evento (ADMIN)' })
  @ApiResponse({
    status: 201,
    description: 'Evento criado com sucesso',
    type: EventResponse,
  })
  @ApiResponse({
    status: 400,
    description:
      'validation_failed | invalid_event_type | invalid_status | event_date_in_past',
  })
  @ApiResponse({ status: 401, description: 'unauthenticated' })
  @ApiResponse({ status: 403, description: 'role_denied | city_scope_denied' })
  @ApiResponse({ status: 404, description: 'local_not_found' })
  create(@Body() dto: CreateEventDto, @Req() req: RequestWithUser) {
    return this.eventsService.create(dto, req.user);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @RequireCityScope()
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar evento (ADMIN da cidade)' })
  @ApiResponse({
    status: 200,
    description: 'Evento atualizado com sucesso',
    type: EventResponse,
  })
  @ApiResponse({
    status: 400,
    description: 'validation_failed | invalid_event_type | invalid_status',
  })
  @ApiResponse({ status: 401, description: 'unauthenticated' })
  @ApiResponse({ status: 403, description: 'role_denied | city_scope_denied' })
  @ApiResponse({
    status: 404,
    description: 'event_not_found | local_not_found',
  })
  @ApiResponse({ status: 409, description: 'event_changed' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @Req() req: RequestWithUser,
  ) {
    return this.eventsService.update(id, dto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RolesGuard)
  @RequireCityScope()
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deletar evento (soft delete, ADMIN da cidade)' })
  @ApiResponse({ status: 204, description: 'Evento deletado com sucesso' })
  @ApiResponse({ status: 401, description: 'unauthenticated' })
  @ApiResponse({ status: 403, description: 'role_denied | city_scope_denied' })
  @ApiResponse({ status: 404, description: 'event_not_found' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.eventsService.remove(id, req.user);
  }
}
