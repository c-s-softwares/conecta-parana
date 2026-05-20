import {
  BadRequestException,
  ConflictException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../../config/prisma.service';

import { CreateCategoryDto } from './dto/request/create-category.dto';

import { generateId } from '../../common/utils/ulid.util';
import { TABLE_PREFIX } from '../../common/types/ulid.types';

@Injectable()
export class CategoryService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const validIcons = ['medical-cross', 'food', 'education', 'tourism'];

    if (!validIcons.includes(dto.icon)) {
      throw new BadRequestException({
        code: 'invalid_icon',
        message: 'Ícone inválido',
      });
    }

    const categoryAlreadyExists = await this.prisma.client.category.findFirst({
      where: {
        name: dto.name,
      },
    });

    if (categoryAlreadyExists) {
      throw new ConflictException({
        code: 'category_duplicate',
        message: 'Categoria já cadastrada',
      });
    }

    const category = await this.prisma.client.category.create({
      data: {
        id: generateId(TABLE_PREFIX.CATEGORY),
        name: dto.name,
        icon: dto.icon,
        deleteAt: null,
      },
    });

    return category;
  }
}
