import {
  Controller,
  Post,
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
import { LikesService } from './likes.service';
import { CreateLikeToggleDto } from './dto/request/create-like-toggle.dto';
import { LikeToggleResponseDto } from './dto/response/like-toggle-response.dto';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtPayload } from '../auth/strategies/jwt.strategy';
import { SkipCacheInvalidation } from '../../common/decorators/skip-cache-invalidation.decorator';

@ApiTags('likes')
@Controller('likes')
@ApiBearerAuth()
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post('toggle')
  @SkipCacheInvalidation()
  @HttpCode(200)
  @Roles(Role.CIDADAO)
  @UseGuards(RolesGuard)
  @ApiOperation({
    summary: 'Dar ou remover like de um recurso (Evento, Comunicado, Notícia)',
  })
  @ApiResponse({
    status: 200,
    description: 'Toggle de like efetuado com sucesso',
    type: LikeToggleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'validation_failed | no_target | multiple_targets',
  })
  @ApiResponse({ status: 401, description: 'unauthenticated' })
  @ApiResponse({ status: 403, description: 'role_denied' })
  @ApiResponse({ status: 404, description: 'target_not_found' })
  async toggleLike(
    @Body() dto: CreateLikeToggleDto,
    @Request() req: ExpressRequest,
  ): Promise<LikeToggleResponseDto> {
    const user = req['user'] as JwtPayload;
    return this.likesService.toggleLike(dto, user.sub);
  }
}
