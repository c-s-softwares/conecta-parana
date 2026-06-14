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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
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
import { Public } from '../../common/decorators/public.decorator';

type RequestWithUser = Request & {
  user: JwtPayload;
};

@ApiTags('events')
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Listar eventos com filtros e paginação' })
  findAll(@Query() query: QueryEventsDto) {
    return this.eventsService.findAll(query);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Buscar evento por ID' })
  findOne(@Param('id') id: string) {
    return this.eventsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @RequireCityScope()
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Criar evento' })
  create(@Body() dto: CreateEventDto, @Req() req: RequestWithUser) {
    return this.eventsService.create(dto, req.user);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @RequireCityScope()
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar evento' })
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
  @ApiOperation({ summary: 'Deletar evento' })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.eventsService.remove(id, req.user);
  }
}
