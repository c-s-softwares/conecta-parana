import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';
import { BaseCrudService } from '../../common/services/base-crud.service';
import { CreateCidadeDto } from './dto/request/create-cidade.dto';
import { UpdateCidadeDto } from './dto/request/update-cidade.dto';
import { CidadeResponse } from './dto/response/cidade-response.dto';

@Injectable()
export class CidadesService extends BaseCrudService<
  CidadeResponse,
  CreateCidadeDto,
  UpdateCidadeDto
> {
  constructor(prisma: PrismaService) {
    super(prisma, {
      tablePrefix: TABLE_PREFIX.CITY,
      entityName: 'Cidade',
    }); //implementa a classe base com os parametros necessarios
  }

  protected getDelegate() {
    //monta o return do delegate(a tabela que será usada no CRUD) para a classe base(basicamente, falando que esse crud e o de cidade)
    return this.prisma.client.city;
  }

  protected toResponse(entity: unknown): CidadeResponse {
    //transforma o modelo que vem do prisma para algo mais amigavel para resposta
    const city = entity as {
      id: string;
      name: string;
      state: string;
      createdAt: Date;
    };
    return {
      id: city.id,
      nome: city.name,
      estado: city.state,
      createdAt: city.createdAt,
    };
  }

  protected toCreateData(dto: CreateCidadeDto): Record<string, unknown> {
    return {
      name: dto.nome,
      state: dto.estado,
    };
  }

  protected toUpdateData(dto: UpdateCidadeDto): Record<string, unknown> {
    return {
      ...(dto.nome && { name: dto.nome }),
      ...(dto.estado && { state: dto.estado }),
    };
  }
}
