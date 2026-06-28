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
   * 3) Verifica existência da entidade alvo.
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
          newsId: dto.entityType === ENTITY_TYPES.NEWS ? entityId : null,
          communicateId:
            dto.entityType === ENTITY_TYPES.COMMUNICATE ? entityId : null,
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
   * - event/local/news/communicate: ADMIN da mesma cidade do recurso.
   * - ticket: ADMIN da mesma cidade do ticket (cidadão dono não pode deletar).
   */
  async remove(id: string, user: JwtPayload): Promise<void> {
    const photo = await this.prisma.client.photo.findUnique({ where: { id } });

    if (!photo) {
      throw new NotFoundException(apiError(UPLOADS_ERRORS.PHOTO_NOT_FOUND));
    }

    const entityType = this.inferEntityType(photo);
    const entityId = this.inferEntityId(photo, entityType);

    await this.assertAuthorized(entityType, entityId, user, { isDelete: true });

    // Reconstrói as keys via buildKey (deterministico a partir dos dados da
    // Photo) em vez de parsear URLs - URL é detalhe do driver de storage.
    await this.safeDelete(this.buildKey(entityType, entityId, photo.id, false));
    if (photo.thumbUrl) {
      await this.safeDelete(
        this.buildKey(entityType, entityId, photo.id, true),
      );
    }
    await this.prisma.client.photo.delete({ where: { id } });
  }

  /**
   * Remove todas as fotos de uma entidade (objetos no storage + linhas). Usado
   * em cascata quando a entidade dona é excluída; a autorização é
   * responsabilidade do caller (que já validou o acesso ao recurso pai).
   */
  async removeAllForEntity(
    entityType: EntityType,
    entityId: string,
  ): Promise<void> {
    const where = this.buildPhotoFkWhere(entityType, entityId);
    const photos = await this.prisma.client.photo.findMany({
      where,
      select: { id: true, thumbUrl: true },
    });

    if (photos.length === 0) return;

    for (const photo of photos) {
      await this.safeDelete(
        this.buildKey(entityType, entityId, photo.id, false),
      );
      if (photo.thumbUrl) {
        await this.safeDelete(
          this.buildKey(entityType, entityId, photo.id, true),
        );
      }
    }

    await this.prisma.client.photo.deleteMany({ where });
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
    const exists = await this.findEntityById(entityType, entityId);
    if (!exists) {
      throw new BadRequestException(apiError(UPLOADS_ERRORS.ENTITY_NOT_FOUND));
    }
  }

  private async findEntityById(
    entityType: EntityType,
    entityId: string,
  ): Promise<{ id: string } | null> {
    switch (entityType) {
      case ENTITY_TYPES.EVENT:
        return this.prisma.client.event.findUnique({
          where: { id: entityId },
          select: { id: true },
        });
      case ENTITY_TYPES.LOCAL:
        return this.prisma.client.local.findFirst({
          where: { id: entityId, deletedAt: null },
          select: { id: true },
        });
      case ENTITY_TYPES.USER_AVATAR:
        return this.prisma.client.user.findUnique({
          where: { id: entityId },
          select: { id: true },
        });
      case ENTITY_TYPES.NEWS:
        return this.prisma.client.news.findUnique({
          where: { id: entityId },
          select: { id: true },
        });
      case ENTITY_TYPES.COMMUNICATE:
        return this.prisma.client.communicate.findUnique({
          where: { id: entityId },
          select: { id: true },
        });
      case ENTITY_TYPES.TICKET:
        return this.prisma.client.ticket.findUnique({
          where: { id: entityId },
          select: { id: true },
        });
    }
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
      //   - Upload: cidadão dono do ticket OU ADMIN da cidade do ticket.
      //   - Delete: apenas ADMIN da cidade do ticket.
      const ticket = await this.prisma.client.ticket.findUnique({
        where: { id: entityId },
        select: { userId: true, cityId: true },
      });
      if (!ticket) {
        throw new BadRequestException(
          apiError(UPLOADS_ERRORS.ENTITY_NOT_FOUND),
        );
      }
      const isAdminOfCity =
        user.role === Role.ADMIN &&
        (!user.cityId || user.cityId === ticket.cityId);
      const isOwner = user.sub === ticket.userId;
      const allowed = opts.isDelete ? isAdminOfCity : isAdminOfCity || isOwner;
      if (!allowed) {
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
  }

  private async getEntityCityId(
    entityType: EntityType,
    entityId: string,
  ): Promise<string> {
    const cityId = await this.findEntityCityId(entityType, entityId);
    if (cityId === null) {
      throw new BadRequestException(apiError(UPLOADS_ERRORS.ENTITY_NOT_FOUND));
    }
    return cityId;
  }

  private async findEntityCityId(
    entityType: EntityType,
    entityId: string,
  ): Promise<string | null> {
    switch (entityType) {
      case ENTITY_TYPES.EVENT: {
        const event = await this.prisma.client.event.findUnique({
          where: { id: entityId },
          select: { cityId: true },
        });
        return event?.cityId ?? null;
      }
      case ENTITY_TYPES.LOCAL: {
        const local = await this.prisma.client.local.findFirst({
          where: { id: entityId, deletedAt: null },
          select: { cityId: true },
        });
        return local?.cityId ?? null;
      }
      case ENTITY_TYPES.NEWS: {
        const news = await this.prisma.client.news.findUnique({
          where: { id: entityId },
          select: { cityId: true },
        });
        return news?.cityId ?? null;
      }
      case ENTITY_TYPES.COMMUNICATE: {
        const communicate = await this.prisma.client.communicate.findUnique({
          where: { id: entityId },
          select: { cityId: true },
        });
        return communicate?.cityId ?? null;
      }
      case ENTITY_TYPES.TICKET: {
        const ticket = await this.prisma.client.ticket.findUnique({
          where: { id: entityId },
          select: { cityId: true },
        });
        return ticket?.cityId ?? null;
      }
      case ENTITY_TYPES.USER_AVATAR:
        // Não chamado para user_avatar; assertAuthorized trata antes.
        return null;
    }
  }

  private async assertPhotoLimit(
    entityType: EntityType,
    entityId: string,
  ): Promise<void> {
    const where = this.buildPhotoFkWhere(entityType, entityId);
    const count = await this.prisma.client.photo.count({ where });
    if (count >= ENTITY_PHOTO_LIMIT) {
      throw new BadRequestException(
        apiError(UPLOADS_ERRORS.PHOTO_LIMIT_REACHED),
      );
    }
  }

  private buildPhotoFkWhere(
    entityType: EntityType,
    entityId: string,
  ): Record<string, string> {
    switch (entityType) {
      case ENTITY_TYPES.EVENT:
        return { eventId: entityId };
      case ENTITY_TYPES.LOCAL:
        return { localId: entityId };
      case ENTITY_TYPES.TICKET:
        return { ticketId: entityId };
      case ENTITY_TYPES.NEWS:
        return { newsId: entityId };
      case ENTITY_TYPES.COMMUNICATE:
        return { communicateId: entityId };
      case ENTITY_TYPES.USER_AVATAR:
        return { userId: entityId };
    }
  }

  private async deleteExistingAvatarFor(userId: string): Promise<void> {
    const existing = await this.prisma.client.photo.findMany({
      where: {
        userId,
        eventId: null,
        localId: null,
        ticketId: null,
        newsId: null,
        communicateId: null,
      },
    });

    for (const old of existing) {
      await this.safeDelete(
        this.buildKey(ENTITY_TYPES.USER_AVATAR, userId, old.id, false),
      );
      if (old.thumbUrl) {
        await this.safeDelete(
          this.buildKey(ENTITY_TYPES.USER_AVATAR, userId, old.id, true),
        );
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

  // ---------------- inferência e resposta ----------------

  private inferEntityType(photo: {
    eventId: string | null;
    localId: string | null;
    ticketId: string | null;
    newsId: string | null;
    communicateId: string | null;
  }): EntityType {
    if (photo.eventId) return ENTITY_TYPES.EVENT;
    if (photo.localId) return ENTITY_TYPES.LOCAL;
    if (photo.ticketId) return ENTITY_TYPES.TICKET;
    if (photo.newsId) return ENTITY_TYPES.NEWS;
    if (photo.communicateId) return ENTITY_TYPES.COMMUNICATE;
    return ENTITY_TYPES.USER_AVATAR;
  }

  private inferEntityId(
    photo: {
      eventId: string | null;
      localId: string | null;
      ticketId: string | null;
      newsId: string | null;
      communicateId: string | null;
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
      case ENTITY_TYPES.NEWS:
        return photo.newsId!;
      case ENTITY_TYPES.COMMUNICATE:
        return photo.communicateId!;
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
