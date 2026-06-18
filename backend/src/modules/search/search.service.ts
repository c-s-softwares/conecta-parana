import { BadRequestException, Injectable } from '@nestjs/common';
import { Event, Communicate, News, Local, Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import { SearchQueryDto } from './dto/search-query.dto';
import { apiError } from '../../common/errors/api-error';
import { SEARCH_ERRORS } from './search.errors';

export type SearchGroup<T> = { items: T[]; total: number };

export interface SearchResults {
  events?: SearchGroup<Event>;
  communicates?: SearchGroup<Communicate>;
  news?: SearchGroup<News>;
  locals?: SearchGroup<Local>;
}

const VALID_TYPES = ['events', 'communicates', 'news', 'locals'];

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async search(dto: SearchQueryDto): Promise<SearchResults> {
    const q = dto.q?.trim() ?? '';

    if (q.length < 3) {
      throw new BadRequestException(apiError(SEARCH_ERRORS.QUERY_TOO_SHORT));
    }

    let parsedTypes = VALID_TYPES;
    if (dto.types) {
      const typesList = dto.types.split(',').map((t) => t.trim());
      const invalid = typesList.find((t) => !VALID_TYPES.includes(t));
      if (invalid) {
        throw new BadRequestException(apiError(SEARCH_ERRORS.INVALID_TYPES));
      }
      parsedTypes = Array.from(new Set(typesList));
    }

    const limit = dto.limit ?? 10;
    const cityId = dto.cityId;

    const baseWhere = cityId ? { cityId } : {};

    const results: SearchResults = {};

    const promises: Promise<void>[] = [];

    if (parsedTypes.includes('events')) {
      const whereClause: Prisma.EventWhereInput = {
        ...baseWhere,
        deletedAt: null,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      };
      promises.push(
        Promise.all([
          this.prisma.client.event.findMany({
            where: whereClause,
            take: limit,
          }),
          this.prisma.client.event.count({
            where: whereClause,
          }),
        ]).then(([items, total]) => {
          results.events = { items, total };
        }),
      );
    }

    if (parsedTypes.includes('communicates')) {
      const whereClause: Prisma.CommunicateWhereInput = {
        ...baseWhere,
        isActive: true,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      };
      promises.push(
        Promise.all([
          this.prisma.client.communicate.findMany({
            where: whereClause,
            take: limit,
          }),
          this.prisma.client.communicate.count({
            where: whereClause,
          }),
        ]).then(([items, total]) => {
          results.communicates = { items, total };
        }),
      );
    }

    if (parsedTypes.includes('news')) {
      const whereClause: Prisma.NewsWhereInput = {
        ...baseWhere,
        isActive: true,
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      };
      promises.push(
        Promise.all([
          this.prisma.client.news.findMany({
            where: whereClause,
            take: limit,
          }),
          this.prisma.client.news.count({
            where: whereClause,
          }),
        ]).then(([items, total]) => {
          results.news = { items, total };
        }),
      );
    }

    if (parsedTypes.includes('locals')) {
      const whereClause: Prisma.LocalWhereInput = {
        ...baseWhere,
        deletedAt: null,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
          { address: { contains: q, mode: 'insensitive' } },
        ],
      };
      promises.push(
        Promise.all([
          this.prisma.client.local.findMany({
            where: whereClause,
            take: limit,
          }),
          this.prisma.client.local.count({
            where: whereClause,
          }),
        ]).then(([items, total]) => {
          results.locals = { items, total };
        }),
      );
    }

    await Promise.all(promises);

    return results;
  }
}
