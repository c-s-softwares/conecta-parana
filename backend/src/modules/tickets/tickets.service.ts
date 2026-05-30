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
import { CreateTicketDto } from './dto/request/create-ticket.dto';
import { UpdateTicketStatusDto } from './dto/request/update-ticket-status.dto';
import { CreateTicketCommentDto } from './dto/request/create-ticket-comment.dto';
import { TicketResponseDto } from './dto/response/ticket-response.dto';
import { TicketCommentResponseDto } from './dto/response/ticket-comment-response.dto';
import { NotificationService } from '../notifications/notifications.service';

@Injectable()
export class TicketsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationService: NotificationService,
  ) {}

  private async getFullTicket(id: string): Promise<TicketResponseDto> {
    const ticket = await this.prisma.client.ticket.findUnique({
      where: { id },
      include: {
        photos: {
          select: { id: true },
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException(apiError(API_ERROR_CODE.TICKET_NOT_FOUND));
    }

    const coords = await this.prisma.client.$queryRaw<
      { lng: number | null; lat: number | null }[]
    >`
      SELECT ST_X(coordinates) as lng, ST_Y(coordinates) as lat
      FROM tickets
      WHERE id = ${id}
    `;

    let coordinates: { lat: number; lng: number } | null = null;
    if (
      coords &&
      coords.length > 0 &&
      coords[0].lat !== null &&
      coords[0].lng !== null
    ) {
      coordinates = {
        lat: coords[0].lat,
        lng: coords[0].lng,
      };
    }

    return {
      id: ticket.id,
      type: ticket.type,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      coordinates,
      address: ticket.address,
      cityId: ticket.cityId,
      userId: ticket.userId,
      assignedToId: ticket.assignedToId,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      resolvedAt: ticket.resolvedAt,
      photoIds: ticket.photos.map((p) => p.id),
    };
  }

  async create(
    dto: CreateTicketDto,
    userId: string,
  ): Promise<TicketResponseDto> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.cityId) {
      throw new BadRequestException(apiError(API_ERROR_CODE.USER_WITHOUT_CITY));
    }

    const allowedTypes = [
      'acidente',
      'sinalização',
      'iluminação',
      'lixo',
      'outros',
    ];
    if (!allowedTypes.includes(dto.type)) {
      throw new BadRequestException(apiError(API_ERROR_CODE.INVALID_TYPE));
    }

    // Verifica a existência e propriedade das fotos
    if (dto.photoIds && dto.photoIds.length > 0) {
      const photos = await this.prisma.client.photo.findMany({
        where: { id: { in: dto.photoIds } },
      });

      if (photos.length !== dto.photoIds.length) {
        throw new BadRequestException(apiError(API_ERROR_CODE.PHOTO_NOT_FOUND));
      }

      const notOwned = photos.some((p) => p.userId !== userId);
      if (notOwned) {
        throw new BadRequestException(apiError(API_ERROR_CODE.PHOTO_NOT_FOUND));
      }
    }

    const ticketId = generateId(TABLE_PREFIX.TICKET);

    await this.prisma.client.ticket.create({
      data: {
        id: ticketId,
        type: dto.type,
        title: dto.title,
        description: dto.description,
        status: 'aberto',
        address: dto.address ?? null,
        cityId: user.cityId,
        userId: user.id,
      },
    });

    if (dto.coordinates) {
      await this.prisma.client.$executeRaw`
        UPDATE tickets
        SET coordinates = ST_SetSRID(ST_MakePoint(${dto.coordinates.lng}, ${dto.coordinates.lat}), 4326)
        WHERE id = ${ticketId}
      `;
    }

    if (dto.photoIds && dto.photoIds.length > 0) {
      await this.prisma.client.photo.updateMany({
        where: { id: { in: dto.photoIds } },
        data: { ticketId },
      });
    }

    return this.getFullTicket(ticketId);
  }

  async findAllForUser(userId: string): Promise<TicketResponseDto[]> {
    const items = await this.prisma.client.ticket.findMany({
      where: { userId },
      orderBy: { id: 'desc' },
      include: {
        photos: {
          select: { id: true },
        },
      },
    });

    if (items.length === 0) return [];

    const ids = items.map((item) => item.id);
    const coords = await this.prisma.client.$queryRaw<
      { id: string; lng: number | null; lat: number | null }[]
    >`
      SELECT id, ST_X(coordinates) as lng, ST_Y(coordinates) as lat
      FROM tickets
      WHERE id = ANY(${ids})
    `;

    const coordsMap = new Map<string, { lat: number; lng: number }>();
    for (const row of coords) {
      if (row.lat !== null && row.lng !== null) {
        coordsMap.set(row.id, { lat: row.lat, lng: row.lng });
      }
    }

    return items.map((ticket) => ({
      id: ticket.id,
      type: ticket.type,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      coordinates: coordsMap.get(ticket.id) ?? null,
      address: ticket.address,
      cityId: ticket.cityId,
      userId: ticket.userId,
      assignedToId: ticket.assignedToId,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      resolvedAt: ticket.resolvedAt,
      photoIds: ticket.photos.map((p) => p.id),
    }));
  }

  async findAllForAdmin(
    adminCityId: string | null,
  ): Promise<TicketResponseDto[]> {
    const items = await this.prisma.client.ticket.findMany({
      where: adminCityId ? { cityId: adminCityId } : {},
      orderBy: { id: 'desc' },
      include: {
        photos: {
          select: { id: true },
        },
      },
    });

    if (items.length === 0) return [];

    const ids = items.map((item) => item.id);
    const coords = await this.prisma.client.$queryRaw<
      { id: string; lng: number | null; lat: number | null }[]
    >`
      SELECT id, ST_X(coordinates) as lng, ST_Y(coordinates) as lat
      FROM tickets
      WHERE id = ANY(${ids})
    `;

    const coordsMap = new Map<string, { lat: number; lng: number }>();
    for (const row of coords) {
      if (row.lat !== null && row.lng !== null) {
        coordsMap.set(row.id, { lat: row.lat, lng: row.lng });
      }
    }

    return items.map((ticket) => ({
      id: ticket.id,
      type: ticket.type,
      title: ticket.title,
      description: ticket.description,
      status: ticket.status,
      coordinates: coordsMap.get(ticket.id) ?? null,
      address: ticket.address,
      cityId: ticket.cityId,
      userId: ticket.userId,
      assignedToId: ticket.assignedToId,
      createdAt: ticket.createdAt,
      updatedAt: ticket.updatedAt,
      resolvedAt: ticket.resolvedAt,
      photoIds: ticket.photos.map((p) => p.id),
    }));
  }

  async findOne(
    id: string,
    userPayload: { sub: string; role: Role; cityId?: string | null },
  ): Promise<TicketResponseDto> {
    const ticket = await this.prisma.client.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException(apiError(API_ERROR_CODE.TICKET_NOT_FOUND));
    }

    if (userPayload.role === Role.ADMIN) {
      if (userPayload.cityId && ticket.cityId !== userPayload.cityId) {
        throw new ForbiddenException(
          apiError(API_ERROR_CODE.NOT_OWNER_OR_ADMIN),
        );
      }
    } else {
      if (ticket.userId !== userPayload.sub) {
        throw new ForbiddenException(
          apiError(API_ERROR_CODE.NOT_OWNER_OR_ADMIN),
        );
      }
    }

    return this.getFullTicket(id);
  }

  async updateStatus(
    id: string,
    dto: UpdateTicketStatusDto,
    adminId: string,
    adminCityId: string | null,
  ): Promise<TicketResponseDto> {
    const ticket = await this.prisma.client.ticket.findUnique({
      where: { id },
    });

    if (!ticket) {
      throw new NotFoundException(apiError(API_ERROR_CODE.TICKET_NOT_FOUND));
    }

    if (adminCityId && ticket.cityId !== adminCityId) {
      throw new ForbiddenException(apiError(API_ERROR_CODE.NOT_OWNER_OR_ADMIN));
    }

    const currentStatus = ticket.status;
    const newStatus = dto.status;

    if (currentStatus !== newStatus) {
      // Transições válidas
      const VALID_TRANSITIONS: Record<string, string[]> = {
        aberto: ['em_análise', 'resolvido', 'fechado'],
        em_análise: ['resolvido', 'fechado'],
        resolvido: ['fechado', 'reaberto'],
        fechado: ['reaberto', 'aberto'],
        reaberto: ['em_análise', 'resolvido', 'fechado'],
      };

      const allowedTransitions = VALID_TRANSITIONS[currentStatus] ?? [];
      if (!allowedTransitions.includes(newStatus)) {
        throw new BadRequestException(
          apiError(API_ERROR_CODE.INVALID_STATUS_TRANSITION),
        );
      }

      // Aplica a regra de 7 dias para reabertura a partir do status fechado
      if (
        currentStatus === 'fechado' &&
        (newStatus === 'reaberto' || newStatus === 'aberto')
      ) {
        const timeDiff = new Date().getTime() - ticket.updatedAt.getTime();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
        if (timeDiff > sevenDaysMs) {
          throw new BadRequestException(
            apiError(API_ERROR_CODE.INVALID_STATUS_TRANSITION),
          );
        }
      }
    }

    const resolvedAt =
      newStatus === 'resolvido'
        ? new Date()
        : ['aberto', 'reaberto', 'em_análise'].includes(newStatus)
          ? null
          : ticket.resolvedAt;

    await this.prisma.client.ticket.update({
      where: { id },
      data: {
        status: newStatus,
        assignedToId:
          dto.assignedToId !== undefined
            ? dto.assignedToId
            : ticket.assignedToId,
        resolvedAt,
      },
    });

    if (currentStatus !== newStatus) {
      // Envia notificação automática
      await this.notificationService.create({
        userId: ticket.userId,
        title: 'Status do seu chamado atualizado',
        description: `O chamado "${ticket.title}" mudou para o status ${newStatus}.`,
      });
    }

    return this.getFullTicket(id);
  }

  async addComment(
    ticketId: string,
    dto: CreateTicketCommentDto,
    userId: string,
    userRole: Role,
    userCityId: string | null,
  ): Promise<TicketCommentResponseDto> {
    const ticket = await this.prisma.client.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException(apiError(API_ERROR_CODE.TICKET_NOT_FOUND));
    }

    if (userRole === Role.ADMIN) {
      if (userCityId && ticket.cityId !== userCityId) {
        throw new ForbiddenException(
          apiError(API_ERROR_CODE.NOT_OWNER_OR_ADMIN),
        );
      }
    } else {
      if (ticket.userId !== userId) {
        throw new ForbiddenException(
          apiError(API_ERROR_CODE.NOT_OWNER_OR_ADMIN),
        );
      }
    }

    const comment = await this.prisma.client.ticketComment.create({
      data: {
        id: generateId(TABLE_PREFIX.TICKET_COMMENT),
        ticketId,
        authorId: userId,
        message: dto.message,
        isInternal: dto.isInternal ?? false,
      },
    });

    return {
      id: comment.id,
      ticketId: comment.ticketId,
      authorId: comment.authorId,
      message: comment.message,
      createdAt: comment.createdAt,
      isInternal: comment.isInternal,
    };
  }

  async findComments(
    ticketId: string,
    userId: string,
    userRole: Role,
    userCityId: string | null,
  ): Promise<TicketCommentResponseDto[]> {
    const ticket = await this.prisma.client.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException(apiError(API_ERROR_CODE.TICKET_NOT_FOUND));
    }

    if (userRole === Role.ADMIN) {
      if (userCityId && ticket.cityId !== userCityId) {
        throw new ForbiddenException(
          apiError(API_ERROR_CODE.NOT_OWNER_OR_ADMIN),
        );
      }
    } else {
      if (ticket.userId !== userId) {
        throw new ForbiddenException(
          apiError(API_ERROR_CODE.NOT_OWNER_OR_ADMIN),
        );
      }
    }

    const whereClause = {
      ticketId,
      ...(userRole !== Role.ADMIN && { isInternal: false }),
    };

    const comments = await this.prisma.client.ticketComment.findMany({
      where: whereClause,
      orderBy: { createdAt: 'asc' },
    });

    return comments.map((comment) => ({
      id: comment.id,
      ticketId: comment.ticketId,
      authorId: comment.authorId,
      message: comment.message,
      createdAt: comment.createdAt,
      isInternal: comment.isInternal,
    }));
  }
}
