import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { generateId } from '../../common/utils/ulid.util';
import { apiError } from '../../common/errors/api-error';
import { SHARED_ERRORS } from '../../common/errors/shared-errors';
import { COMUNICADOS_ERRORS } from './communicates.errors';
import { CreateCommunicateDto } from './dto/request/create-communicate.dto';
import { UpdateCommunicateDto } from './dto/request/update-communicate.dto';
import { QueryComunicadoDto } from './dto/request/query-communicate.dto';
import { CommunicateResponse } from './dto/response/communicate-response.dto';
import { Role } from '@prisma/client';

type AuthUser = {
  id: string;
  cityId?: string | null;
  role: Role;
};

@Injectable()
export class CommunicateService extends BaseCrudService<
  CommunicateResponse,
  CreateCommunicateDto,
  UpdateCommunicateDto
> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      tablePrefix: TABLE_PREFIX.COMMUNICATE,
      entityName: 'Comunicado',
      duplicateErrorKey: COMUNICADOS_ERRORS.COMUNICADO_NOT_FOUND,
      notFoundErrorKey: COMUNICADOS_ERRORS.COMUNICADO_NOT_FOUND,
      softDelete: false,
    });
  }

  protected getDelegate() {
    return this.prisma.client.communicate;
  }

  protected toResponse(entity: unknown): CommunicateResponse {
    const communicate = entity as {
      id: string;
      title: string;
      description: string;
      isActive: boolean;
      cityId: string;
      userId: string;
    };

    return {
      id: communicate.id,
      title: communicate.title,
      description: communicate.description,
      isActive: communicate.isActive,
      cityId: communicate.cityId,
      userId: communicate.userId,
    };
  }

  protected toCreateData(dto: CreateCommunicateDto): Record<string, unknown> {
    return {
      title: dto.title,
      description: dto.description,
      isActive: dto.isActive ?? true,
      cityId: dto.cityId,
    };
  }

  protected toUpdateData(dto: UpdateCommunicateDto): Record<string, unknown> {
    return {
      ...(dto.title && { title: dto.title }),
      ...(dto.description && { description: dto.description }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };
  }

  protected buildSearchWhere(
    query: QueryComunicadoDto,
  ): Record<string, unknown> {
    return {
      ...(query.cityId && { cityId: query.cityId }),
      ...(query.isActive !== undefined && {
        isActive: query.isActive === 'true',
      }),
      ...(query.search && {
        title: {
          contains: query.search,
          mode: 'insensitive',
        },
      }),
    };
  }

  async createWithUser(
    dto: CreateCommunicateDto,
    user: AuthUser,
  ): Promise<CommunicateResponse> {
    const cityId = this.resolveCityId(dto.cityId, user);

    const communicate = await this.prisma.client.communicate.create({
      data: {
        id: generateId(TABLE_PREFIX.COMMUNICATE),
        title: dto.title,
        description: dto.description,
        isActive: dto.isActive ?? true,
        cityId,
        userId: user.id,
      },
    });

    return this.toResponse(communicate);
  }

  async updateWithUser(
    id: string,
    dto: UpdateCommunicateDto,
    user: AuthUser,
  ): Promise<CommunicateResponse> {
    const communicate = await this.findCommunicateOrFail(id);

    this.validateCityScope(communicate.cityId, user);

    const updated = await this.prisma.client.communicate.update({
      where: { id },
      data: this.toUpdateData(dto),
    });

    return this.toResponse(updated);
  }

  async removeWithUser(id: string, user: AuthUser): Promise<void> {
    const communicate = await this.findCommunicateOrFail(id);

    this.validateCityScope(communicate.cityId, user);

    await this.prisma.client.communicate.update({
      where: { id },
      data: {
        isActive: false,
      },
    });
  }

  override async findAll(query: QueryComunicadoDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 10;
    const where = { ...this.buildBaseWhere(), ...this.buildSearchWhere(query) };

    const [items, total] = await Promise.all([
      this.getDelegate().findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { id: 'desc' },
      }),
      this.getDelegate().count({ where }),
    ]);

    return {
      items: items.map((i) => this.toResponse(i)),
      total,
      page,
      pageSize,
    };
  }

  private async findCommunicateOrFail(id: string) {
    const communicate = await this.prisma.client.communicate.findUnique({
      where: { id },
    });

    if (!communicate) {
      throw new NotFoundException(
        apiError(COMUNICADOS_ERRORS.COMUNICADO_NOT_FOUND),
      );
    }

    return communicate;
  }

  private resolveCityId(
    payloadCityId: string | undefined,
    user: AuthUser,
  ): string {
    const isSuperAdmin = user.role === Role.ADMIN && user.cityId === null;
    if (isSuperAdmin) {
      if (!payloadCityId) {
        throw new BadRequestException(apiError(SHARED_ERRORS.CITY_REQUIRED));
      }
      return payloadCityId;
    }

    if (!user.cityId) {
      throw new ForbiddenException(apiError(SHARED_ERRORS.CITY_SCOPE_DENIED));
    }

    return user.cityId;
  }

  private validateCityScope(entityCityId: string, user: AuthUser): void {
    const isSuperAdmin = user.role === Role.ADMIN && user.cityId === null;
    if (isSuperAdmin) {
      return;
    }

    if (entityCityId !== user.cityId) {
      throw new ForbiddenException(apiError(SHARED_ERRORS.CITY_SCOPE_DENIED));
    }
  }
}
