import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { TABLE_PREFIX } from '../../common/types/ulid.types';
import { generateId } from '../../common/utils/ulid.util';

@Injectable()
export class NotificationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: { userId: string; title: string; description: string }) {
    return this.prisma.client.notification.create({
      data: {
        id: generateId(TABLE_PREFIX.NOTIFICATION),
        title: data.title,
        description: data.description,
        userId: data.userId,
        isRead: false,
      },
    });
  }
}
