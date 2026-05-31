import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import sharp from 'sharp';
import { PrismaService } from '../../config/prisma.service';
import { generateId } from '../../common/utils/ulid.util';
import { TABLE_PREFIX } from '../../common/types/ulid.types';
import { apiError } from '../../common/errors/api-error';
import { SHARED_ERRORS } from '../../common/errors/shared-errors';
import { StorageService } from '../storage/storage.service';
import { UPLOADS_ERRORS } from './uploads.errors';
import {
  ENTITY_TYPES,
  ENTITY_TYPES_REQUIRING_ID,
  ENTITY_TYPE_VALUES,
  EntityType,
} from './constants/entity-type';
import { UploadPhotoDto } from './dto/request/upload-photo.dto';
import { PhotoResponseDto } from './dto/response/photo-response.dto';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ENTITY_PHOTO_LIMIT = 10;
const ORIGINAL_MAX_HEIGHT_PX = 1080;
const THUMB_HEIGHT_PX = 320;

@Injectable()
export class UploadsService {
  private readonly logger = new Logger(UploadsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  /**
   * Upload de foto associada a uma entidade. Fluxo:
   * 1) Validações de arquivo (tipo, tamanho) e entityType (whitelist).
   * 2) Resolve entityId efetivo (user.sub para user_avatar).
   * 3) Verifica existência da entidade alvo (exceto ticket, ainda não modelado).
   * 4) Verifica autorização (papel + escopo de cidade).
   * 5) user_avatar: remove avatar anterior do mesmo usuário (1 ativo por user).
   * 6) Demais tipos: enforce limite de 10 fotos por entidade.
   * 7) Sharp: original WebP <= 1080p de altura + thumb WebP 320p.
   * 8) Upload (storage) e persistência (Photo).
   * 9) Retorna PhotoResponseDto.
   *
   * Em caso de falha após upload de algum objeto no storage, faz cleanup
   * para evitar lixo no bucket.
   */
  async upload(
    file: Express.Multer.File | undefined,
    dto: UploadPhotoDto,
    user: JwtPayload,
  ): Promise<PhotoResponseDto> {
    this.assertFile(file);
    this.assertEntityType(dto.entityType);

    const entityId = this.resolveEntityId(dto, user);
    await this.assertEntityExists(dto.entityType, entityId);
    await this.assertAuthorized(dto.entityType, entityId, user);

    if (dto.entityType === ENTITY_TYPES.USER_AVATAR) {
      await this.deleteExistingAvatarFor(user.sub);
    } else {
      await this.assertPhotoLimit(dto.entityType, entityId);
    }

    const photoId = generateId(TABLE_PREFIX.PHOTO);
    const { originalBuffer, thumbBuffer } = await this.resize(file.buffer);

    const originalKey = this.buildKey(dto.entityType, entityId, photoId, false);
    const thumbKey = this.buildKey(dto.entityType, entityId, photoId, true);

    const originalUrl = await this.storage.upload(
      originalKey,
      originalBuffer,
      'image/webp',
    );

    let thumbUrl: string;
    try {
      thumbUrl = await this.storage.upload(thumbKey, thumbBuffer, 'image/webp');
    } catch (err) {
      await this.safeDelete(originalKey);
      throw err;
    }

    try {
      const photo = await this.prisma.client.photo.create({
        data: {
          id: photoId,
          url: originalUrl,
          thumbUrl,
          userId: user.sub,
          eventId: dto.entityType === ENTITY_TYPES.EVENT ? entityId : null,
          localId: dto.entityType === ENTITY_TYPES.LOCAL ? entityId : null,
          ticketId: dto.entityType === ENTITY_TYPES.TICKET ? entityId : null,
        },
      });

      return this.toResponse(photo, dto.entityType, entityId);
    } catch (err) {
      // Cleanup de orfãos no bucket se a persistência falhar.
      await this.safeDelete(originalKey);
      await this.safeDelete(thumbKey);
      throw err;
    }
  }

  /**
   * Remove foto por id. Autorização:
   * - user_avatar: apenas o dono da foto.
   * - event/local: qualquer ADMIN da mesma cidade do recurso.
   * - ticket: apenas ADMIN (city scope será adicionado em CPR-27, quando o
   *   modelo Ticket existir e expuser cityId).
   */
  async remove(id: string, user: JwtPayload): Promise<void> {
    const photo = await this.prisma.client.photo.findUnique({ where: { id } });

    if (!photo) {
      throw new NotFoundException(apiError(UPLOADS_ERRORS.PHOTO_NOT_FOUND));
    }

    const entityType = this.inferEntityType(photo);
    const entityId = this.inferEntityId(photo, entityType);

    await this.assertAuthorized(entityType, entityId, user, { isDelete: true });

    await this.safeDelete(this.urlToKey(photo.url));
    if (photo.thumbUrl) {
      await this.safeDelete(this.urlToKey(photo.thumbUrl));
    }
    await this.prisma.client.photo.delete({ where: { id } });
  }

  // ---------------- helpers de validação ----------------

  private assertFile(file: Express.Multer.File | undefined): asserts file {
    if (!file) {
      throw new BadRequestException(apiError(UPLOADS_ERRORS.INVALID_FILE_TYPE));
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      throw new BadRequestException(apiError(UPLOADS_ERRORS.INVALID_FILE_TYPE));
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestException(apiError(UPLOADS_ERRORS.FILE_TOO_LARGE));
    }
  }

  private assertEntityType(entityType: string): void {
    if (!ENTITY_TYPE_VALUES.includes(entityType as EntityType)) {
      throw new BadRequestException(
        apiError(UPLOADS_ERRORS.INVALID_ENTITY_TYPE),
      );
    }
  }

  private resolveEntityId(dto: UploadPhotoDto, user: JwtPayload): string {
    if (dto.entityType === ENTITY_TYPES.USER_AVATAR) {
      return user.sub;
    }
    if (ENTITY_TYPES_REQUIRING_ID.includes(dto.entityType) && !dto.entityId) {
      throw new BadRequestException(
        apiError(UPLOADS_ERRORS.ENTITY_ID_REQUIRED),
      );
    }
    return dto.entityId!;
  }

  private async assertEntityExists(
    entityType: EntityType,
    entityId: string,
  ): Promise<void> {
    if (entityType === ENTITY_TYPES.EVENT) {
      const exists = await this.prisma.client.event.findUnique({
        where: { id: entityId },
        select: { id: true },
      });
      if (!exists) {
        throw new BadRequestException(
          apiError(UPLOADS_ERRORS.ENTITY_NOT_FOUND),
        );
      }
      return;
    }
    if (entityType === ENTITY_TYPES.LOCAL) {
      const exists = await this.prisma.client.local.findFirst({
        where: { id: entityId, deletedAt: null },
        select: { id: true },
      });
      if (!exists) {
        throw new BadRequestException(
          apiError(UPLOADS_ERRORS.ENTITY_NOT_FOUND),
        );
      }
      return;
    }
    if (entityType === ENTITY_TYPES.USER_AVATAR) {
      const exists = await this.prisma.client.user.findUnique({
        where: { id: entityId },
        select: { id: true },
      });
      if (!exists) {
        throw new BadRequestException(
          apiError(UPLOADS_ERRORS.ENTITY_NOT_FOUND),
        );
      }
      return;
    }
    // ticket: modelo ainda não existe. Aceita o id sem verificar.
  }

  private async assertAuthorized(
    entityType: EntityType,
    entityId: string,
    user: JwtPayload,
    opts: { isDelete?: boolean } = {},
  ): Promise<void> {
    if (entityType === ENTITY_TYPES.USER_AVATAR) {
      // Avatar: apenas o próprio usuário.
      if (user.sub !== entityId) {
        throw new ForbiddenException(
          apiError(SHARED_ERRORS.NOT_OWNER_OR_ADMIN),
        );
      }
      return;
    }

    if (entityType === ENTITY_TYPES.TICKET) {
      // Regra do produto:
      //   - Upload: qualquer autenticado (o cidadão envia fotos do próprio
      //     ticket; ADMIN também pode anexar do lado do suporte).
      //   - Delete: apenas ADMIN da cidade do ticket.
      //
      // TODO: quando o modelo Ticket existir, validar city scope no
      //   delete via `getEntityCityId('ticket', entityId)` (ticket vai ter
      //   cityId). Hoje validamos apenas o papel ADMIN no delete; a checagem
      //   de cidade fica indisponível porque o ticket não está no schema.
      if (opts.isDelete && user.role !== Role.ADMIN) {
        throw new ForbiddenException(
          apiError(SHARED_ERRORS.NOT_OWNER_OR_ADMIN),
        );
      }
      return;
    }

    if (user.role !== Role.ADMIN) {
      throw new ForbiddenException(apiError(SHARED_ERRORS.NOT_OWNER_OR_ADMIN));
    }

    const targetCityId = await this.getEntityCityId(entityType, entityId);

    if (user.cityId && user.cityId !== targetCityId) {
      throw new ForbiddenException(apiError(SHARED_ERRORS.CITY_SCOPE_DENIED));
    }

    // opts.isDelete consumido apenas no branch de ticket (acima); para
    // event/local a regra é a mesma para upload e delete.
    void opts;
    void opts;
  }

  private async getEntityCityId(
    entityType: EntityType,
    entityId: string,
  ): Promise<string> {
    if (entityType === ENTITY_TYPES.EVENT) {
      const event = await this.prisma.client.event.findUnique({
        where: { id: entityId },
        select: { cityId: true },
      });
      if (!event) {
        throw new BadRequestException(
          apiError(UPLOADS_ERRORS.ENTITY_NOT_FOUND),
        );
      }
      return event.cityId;
    }
    const local = await this.prisma.client.local.findFirst({
      where: { id: entityId, deletedAt: null },
      select: { cityId: true },
    });
    if (!local) {
      throw new BadRequestException(apiError(UPLOADS_ERRORS.ENTITY_NOT_FOUND));
    }
    return local.cityId;
  }

  private async assertPhotoLimit(
    entityType: EntityType,
    entityId: string,
  ): Promise<void> {
    const where =
      entityType === ENTITY_TYPES.EVENT
        ? { eventId: entityId }
        : entityType === ENTITY_TYPES.LOCAL
          ? { localId: entityId }
          : { ticketId: entityId };

    const count = await this.prisma.client.photo.count({ where });
    if (count >= ENTITY_PHOTO_LIMIT) {
      throw new BadRequestException(
        apiError(UPLOADS_ERRORS.PHOTO_LIMIT_REACHED),
      );
    }
  }

  private async deleteExistingAvatarFor(userId: string): Promise<void> {
    const existing = await this.prisma.client.photo.findMany({
      where: {
        userId,
        eventId: null,
        localId: null,
        ticketId: null,
      },
    });

    for (const old of existing) {
      await this.safeDelete(this.urlToKey(old.url));
      if (old.thumbUrl) {
        await this.safeDelete(this.urlToKey(old.thumbUrl));
      }
      await this.prisma.client.photo.delete({ where: { id: old.id } });
    }
  }

  // ---------------- processamento e storage ----------------

  private async resize(
    buffer: Buffer,
  ): Promise<{ originalBuffer: Buffer; thumbBuffer: Buffer }> {
    const originalBuffer = await sharp(buffer)
      .resize({
        height: ORIGINAL_MAX_HEIGHT_PX,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 85 })
      .toBuffer();

    const thumbBuffer = await sharp(buffer)
      .resize({
        height: THUMB_HEIGHT_PX,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();

    return { originalBuffer, thumbBuffer };
  }

  private buildKey(
    entityType: EntityType,
    entityId: string,
    photoId: string,
    isThumb: boolean,
  ): string {
    const suffix = isThumb ? '-thumb' : '';
    return `photos/${entityType}/${entityId}/${photoId}${suffix}.webp`;
  }

  private async safeDelete(key: string): Promise<void> {
    try {
      await this.storage.delete(key);
    } catch (err) {
      this.logger.warn(`Falha ao apagar objeto ${key} do storage (ignorado).`);
      this.logger.debug(err);
    }
  }

  private urlToKey(url: string): string {
    // URL pública: https://objectstorage.<region>.oraclecloud.com/n/<ns>/b/<bucket>/o/<key>
    const marker = '/o/';
    const idx = url.indexOf(marker);
    if (idx < 0) return url;
    return decodeURI(url.slice(idx + marker.length));
  }

  // ---------------- inferência e resposta ----------------

  private inferEntityType(photo: {
    eventId: string | null;
    localId: string | null;
    ticketId: string | null;
  }): EntityType {
    if (photo.eventId) return ENTITY_TYPES.EVENT;
    if (photo.localId) return ENTITY_TYPES.LOCAL;
    if (photo.ticketId) return ENTITY_TYPES.TICKET;
    return ENTITY_TYPES.USER_AVATAR;
  }

  private inferEntityId(
    photo: {
      eventId: string | null;
      localId: string | null;
      ticketId: string | null;
      userId: string;
    },
    entityType: EntityType,
  ): string {
    switch (entityType) {
      case ENTITY_TYPES.EVENT:
        return photo.eventId!;
      case ENTITY_TYPES.LOCAL:
        return photo.localId!;
      case ENTITY_TYPES.TICKET:
        return photo.ticketId!;
      case ENTITY_TYPES.USER_AVATAR:
        return photo.userId;
    }
  }

  private toResponse(
    photo: {
      id: string;
      url: string;
      thumbUrl: string | null;
    },
    entityType: EntityType,
    entityId: string,
  ): PhotoResponseDto {
    return {
      id: photo.id,
      url: photo.url,
      thumbUrl: photo.thumbUrl,
      entityType,
      entityId,
    };
  }
}
