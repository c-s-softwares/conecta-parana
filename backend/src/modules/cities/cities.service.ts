import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { CreateCityDto } from './dto/request/create-city.dto';
import { UpdateCityDto } from './dto/request/update-city.dto';
import { CityResponse } from './dto/response/city-response.dto';
import { FindCitiesQueryDto } from './dto/request/find-cities-query.dto';
import { PaginatedResponseDto } from '../../common/dto/response/paginated-response.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class CitiesService extends BaseCrudService<
  CityResponse,
  CreateCityDto,
  UpdateCityDto
> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      tablePrefix: TABLE_PREFIX.CITY,
      entityName: 'Cidade',
    });
  }

  protected getDelegate() {
    return this.prisma.client.city;
  }

  protected toResponse(entity: unknown): CityResponse {
    const city = entity as {
      id: string;
      name: string;
      state: string;
      createdAt: Date;
    };
    return {
      id: city.id,
      name: city.name,
      state: city.state,
    };
  }

  protected toCreateData(dto: CreateCityDto): Record<string, unknown> {
    return {
      name: dto.name,
      state: dto.state,
    };
  }

  protected toUpdateData(dto: UpdateCityDto): Record<string, unknown> {
    return {
      ...(dto.name && { name: dto.name }),
      ...(dto.state && { state: dto.state }),
    };
  }

  async findAll(
    query: FindCitiesQueryDto,
  ): Promise<PaginatedResponseDto<CityResponse>> {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const skip = (page - 1) * pageSize;

    const where: Prisma.CityWhereInput = {
      deletedAt: null,
      ...(query.search && {
        name: {
          contains: query.search,
          mode: 'insensitive',
        },
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.client.city.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { name: 'asc' },
      }),
      this.prisma.client.city.count({ where }),
    ]);

    return {
      items: items.map((item) => this.toResponse(item)),
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: string): Promise<CityResponse> {
    const entity = await this.prisma.client.city.findFirst({
      where: { id, deletedAt: null },
    });

    if (!entity) {
      throw new NotFoundException('city_not_found');
    }

    return this.toResponse(entity);
  }

  async create(dto: CreateCityDto): Promise<CityResponse> {
    try {
      return await super.create(dto);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('city_duplicate');
      }
      throw error;
    }
  }

  async update(id: string, dto: UpdateCityDto): Promise<CityResponse> {
    await this.findOne(id);

    try {
      const updated = await this.prisma.client.city.update({
        where: { id },
        data: this.toUpdateData(dto),
      });
      return this.toResponse(updated);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('city_duplicate');
      }
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);

    const cityWithRelations = await this.prisma.client.city.findUnique({
      where: { id },
      select: {
        _count: {
          select: {
            users: true,
            events: true,
            locals: true,
            news: true,
          },
        },
      },
    });

    if (!cityWithRelations) {
      throw new NotFoundException('city_not_found');
    }

    const { users, events, locals, news } = cityWithRelations._count;
    if (users > 0 || events > 0 || locals > 0 || news > 0) {
      throw new ConflictException('city_has_content');
    }

    //soft
    await this.prisma.client.city.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
