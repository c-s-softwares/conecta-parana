import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';
import { generateId } from '../../common/utils/ulid.util';
import { apiError, API_ERROR_CODE } from '../../common/errors/api-error';
import { CreateSuggestionDto } from './dto/request/create-suggestion.dto';
import { RespondSuggestionDto } from './dto/request/respond-suggestion.dto';
import { SuggestionResponseDto } from './dto/response/suggestion-response.dto';
import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class SuggestionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  private toResponse(e: {
    id: string;
    subject: string;
    message: string;
    status: string;
    userId: string;
    cityId: string;
    response: string | null;
    respondedAt: Date | null;
    respondedById: string | null;
  }): SuggestionResponseDto {
    return {
      id: e.id,
      subject: e.subject,
      message: e.message,
      status: e.status,
      userId: e.userId,
      cityId: e.cityId,
      response: e.response,
      respondedAt: e.respondedAt,
      respondedById: e.respondedById,
    };
  }

  async create(
    dto: CreateSuggestionDto,
    userId: string,
  ): Promise<SuggestionResponseDto> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.cityId) {
      throw new BadRequestException(apiError(API_ERROR_CODE.USER_WITHOUT_CITY));
    }

    if (dto.subject.length > 200) {
      throw new BadRequestException(apiError(API_ERROR_CODE.SUBJECT_TOO_LONG));
    }

    if (dto.message.length > 1000) {
      throw new BadRequestException(apiError(API_ERROR_CODE.MESSAGE_TOO_LONG));
    }

    const suggestion = await this.prisma.client.suggestion.create({
      data: {
        id: generateId(TABLE_PREFIX.SUGGESTION),
        subject: dto.subject,
        message: dto.message,
        status: 'enviada',
        userId: user.id,
        cityId: user.cityId,
      },
    });

    return this.toResponse(suggestion);
  }

  async findAllForUser(userId: string): Promise<SuggestionResponseDto[]> {
    const items = await this.prisma.client.suggestion.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
    });
    return items.map((item) => this.toResponse(item));
  }

  async findAllForAdmin(
    adminCityId: string | null,
  ): Promise<SuggestionResponseDto[]> {
    const items = await this.prisma.client.suggestion.findMany({
      where: adminCityId ? { cityId: adminCityId } : {},
      orderBy: { id: 'desc' },
    });
    return items.map((item) => this.toResponse(item));
  }

  async findOne(
    id: string,
    userPayload: { sub: string; role: Role; cityId?: string | null },
  ): Promise<SuggestionResponseDto> {
    const suggestion = await this.prisma.client.suggestion.findUnique({
      where: { id },
    });

    if (!suggestion) {
      throw new NotFoundException(
        apiError(API_ERROR_CODE.SUGGESTION_NOT_FOUND),
      );
    }

    if (userPayload.role === Role.ADMIN) {
      // Administradores só podem visualizar sugestões da própria cidade
      if (userPayload.cityId && suggestion.cityId !== userPayload.cityId) {
        throw new ForbiddenException(
          apiError(API_ERROR_CODE.NOT_OWNER_OR_ADMIN),
        );
      }

      // Transição automática de 'enviada' para 'lida' quando visualizada pelo administrador
      if (suggestion.status === 'enviada') {
        const updated = await this.prisma.client.suggestion.update({
          where: { id },
          data: { status: 'lida' },
        });
        return this.toResponse(updated);
      }
    } else {
      // Cidadãos só podem visualizar as próprias sugestões
      if (suggestion.userId !== userPayload.sub) {
        throw new ForbiddenException(
          apiError(API_ERROR_CODE.NOT_OWNER_OR_ADMIN),
        );
      }
    }

    return this.toResponse(suggestion);
  }

  async respond(
    id: string,
    dto: RespondSuggestionDto,
    adminId: string,
    adminCityId: string | null,
  ): Promise<SuggestionResponseDto> {
    const suggestion = await this.prisma.client.suggestion.findUnique({
      where: { id },
    });

    if (!suggestion) {
      throw new NotFoundException(
        apiError(API_ERROR_CODE.SUGGESTION_NOT_FOUND),
      );
    }

    if (adminCityId && suggestion.cityId !== adminCityId) {
      throw new ForbiddenException(apiError(API_ERROR_CODE.NOT_OWNER_OR_ADMIN));
    }

    // Bloqueia transição se a sugestão já foi respondida, concluída ou arquivada
    if (['respondida', 'concluída', 'arquivada'].includes(suggestion.status)) {
      throw new BadRequestException(
        apiError(API_ERROR_CODE.INVALID_STATUS_TRANSITION),
      );
    }

    const updated = await this.prisma.client.suggestion.update({
      where: { id },
      data: {
        response: dto.response,
        respondedAt: new Date(),
        respondedById: adminId,
        status: 'respondida',
      },
    });

    // Envia notificação automática ao cidadão
    await this.notificationService.create({
      userId: suggestion.userId,
      title: 'Sua sugestão foi respondida!',
      description: `Sua sugestão sobre "${suggestion.subject}" foi respondida.`,
    });

    return this.toResponse(updated);
  }

  async conclude(
    id: string,
    dto: RespondSuggestionDto,
    adminId: string,
    adminCityId: string | null,
  ): Promise<SuggestionResponseDto> {
    const suggestion = await this.prisma.client.suggestion.findUnique({
      where: { id },
    });

    if (!suggestion) {
      throw new NotFoundException(
        apiError(API_ERROR_CODE.SUGGESTION_NOT_FOUND),
      );
    }

    if (adminCityId && suggestion.cityId !== adminCityId) {
      throw new ForbiddenException(apiError(API_ERROR_CODE.NOT_OWNER_OR_ADMIN));
    }

    // Transição de conclusão só aceita a partir do status respondida
    if (suggestion.status !== 'respondida') {
      throw new BadRequestException(
        apiError(API_ERROR_CODE.INVALID_STATUS_TRANSITION),
      );
    }

    const updated = await this.prisma.client.suggestion.update({
      where: { id },
      data: {
        response: dto.response,
        respondedAt: new Date(),
        respondedById: adminId,
        status: 'concluída',
      },
    });

    // Envia notificação automática ao cidadão
    await this.notificationService.create({
      userId: suggestion.userId,
      title: 'Sua sugestão foi concluída!',
      description: `Sua sugestão sobre "${suggestion.subject}" foi concluída.`,
    });

    return this.toResponse(updated);
  }

  async archive(
    id: string,
    dto: RespondSuggestionDto,
    adminId: string,
    adminCityId: string | null,
  ): Promise<SuggestionResponseDto> {
    const suggestion = await this.prisma.client.suggestion.findUnique({
      where: { id },
    });

    if (!suggestion) {
      throw new NotFoundException(
        apiError(API_ERROR_CODE.SUGGESTION_NOT_FOUND),
      );
    }

    if (adminCityId && suggestion.cityId !== adminCityId) {
      throw new ForbiddenException(apiError(API_ERROR_CODE.NOT_OWNER_OR_ADMIN));
    }

    // Re-arquivar é idempotente -- retorna sem escrita no banco
    if (suggestion.status === 'arquivada') {
      return this.toResponse(suggestion);
    }

    // Concluída é terminal positivo -- não pode ser arquivada
    if (suggestion.status === 'concluída') {
      throw new BadRequestException(
        apiError(API_ERROR_CODE.INVALID_STATUS_TRANSITION),
      );
    }

    const updated = await this.prisma.client.suggestion.update({
      where: { id },
      data: {
        response: dto.response,
        respondedAt: new Date(),
        respondedById: adminId,
        status: 'arquivada',
      },
    });

    // Envia notificação automática ao cidadão
    await this.notificationService.create({
      userId: suggestion.userId,
      title: 'Sua sugestão foi arquivada.',
      description: `Sua sugestão sobre "${suggestion.subject}" foi arquivada.`,
    });

    return this.toResponse(updated);
  }
}
