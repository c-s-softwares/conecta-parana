import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Request,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { memoryStorage } from 'multer';
import type { Request as ExpressRequest } from 'express';
import { apiError } from '../../common/errors/api-error';
import { UPLOADS_ERRORS } from './uploads.errors';
import { UploadsService } from './uploads.service';
import { UploadPhotoDto } from './dto/request/upload-photo.dto';
import { PhotoResponseDto } from './dto/response/photo-response.dto';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('uploads/photos')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @ApiOperation({
    summary: 'Upload de foto associada a uma entidade (multipart/form-data)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'entityType'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo de imagem (JPEG, PNG ou WebP) com até 5MB',
        },
        entityType: {
          type: 'string',
          enum: [
            'event',
            'local',
            'ticket',
            'news',
            'communicate',
            'user_avatar',
          ],
        },
        entityId: {
          type: 'string',
          description:
            'ULID da entidade alvo. Obrigatório para event, local, ticket, news e communicate; ignorado para user_avatar.',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Foto enviada e persistida',
    type: PhotoResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'invalid_file_type | file_too_large | file_required | invalid_entity_type | entity_id_required | entity_not_found | photo_limit_reached',
  })
  @ApiResponse({ status: 401, description: 'unauthenticated' })
  @ApiResponse({
    status: 403,
    description: 'not_owner_or_admin | city_scope_denied',
  })
  @ApiResponse({
    status: 503,
    description: 'storage_unavailable (falha ao acessar o bucket após retries)',
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: MAX_FILE_SIZE_BYTES },
      fileFilter: (_req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.mimetype)) {
          cb(
            new BadRequestException(apiError(UPLOADS_ERRORS.INVALID_FILE_TYPE)),
            false,
          );
          return;
        }
        cb(null, true);
      },
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: UploadPhotoDto,
    @Request() req: ExpressRequest,
  ): Promise<PhotoResponseDto> {
    if (!file) {
      throw new BadRequestException(apiError(UPLOADS_ERRORS.FILE_REQUIRED));
    }
    const user = req['user'] as JwtPayload;
    return this.uploadsService.upload(file, dto, user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove foto por id' })
  @ApiResponse({ status: 204, description: 'Removido com sucesso' })
  @ApiResponse({ status: 401, description: 'unauthenticated' })
  @ApiResponse({
    status: 403,
    description: 'not_owner_or_admin | city_scope_denied',
  })
  @ApiResponse({ status: 404, description: 'photo_not_found' })
  remove(
    @Param('id') id: string,
    @Request() req: ExpressRequest,
  ): Promise<void> {
    const user = req['user'] as JwtPayload;
    return this.uploadsService.remove(id, user);
  }
}
