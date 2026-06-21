import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../config/prisma.service';
import {
  DashboardMetricsResponseDto,
  DeltaStatDto,
} from './dto/response/dashboard-metrics-response.dto';
import {
  ChartBucketDto,
  DashboardChartResponseDto,
} from './dto/response/dashboard-chart-response.dto';
import { DashboardActivityItemDto } from './dto/response/dashboard-activity-response.dto';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getMetrics(): Promise<DashboardMetricsResponseDto> {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [
      communicatesTotal,
      communicatesThisMonth,
      communicatesLastMonth,
      eventsTotal,
      eventsThisMonth,
      eventsLastMonth,
      localsTotal,
      localsThisMonth,
      localsLastMonth,
      notificationsTotal,
      notificationsThisMonth,
      notificationsLastMonth,
    ] = await Promise.all([
      this.prisma.client.communicate.count(),
      this.prisma.client.communicate.count({
        where: { createdAt: { gte: thisMonthStart } },
      }),
      this.prisma.client.communicate.count({
        where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } },
      }),
      this.prisma.client.event.count({
        where: { deletedAt: null, isActive: true },
      }),
      this.prisma.client.event.count({
        where: {
          deletedAt: null,
          isActive: true,
          createdAt: { gte: thisMonthStart },
        },
      }),
      this.prisma.client.event.count({
        where: {
          deletedAt: null,
          isActive: true,
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }),
      this.prisma.client.local.count({ where: { deletedAt: null } }),
      this.prisma.client.local.count({
        where: { deletedAt: null, createdAt: { gte: thisMonthStart } },
      }),
      this.prisma.client.local.count({
        where: {
          deletedAt: null,
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
        },
      }),
      this.prisma.client.notification.count(),
      this.prisma.client.notification.count({
        where: { createdAt: { gte: thisMonthStart } },
      }),
      this.prisma.client.notification.count({
        where: { createdAt: { gte: lastMonthStart, lt: thisMonthStart } },
      }),
    ]);

    return {
      communicates: this.buildDelta(
        communicatesTotal,
        communicatesThisMonth,
        communicatesLastMonth,
      ),
      events: this.buildDelta(eventsTotal, eventsThisMonth, eventsLastMonth),
      locals: this.buildDelta(localsTotal, localsThisMonth, localsLastMonth),
      notifications: this.buildDelta(
        notificationsTotal,
        notificationsThisMonth,
        notificationsLastMonth,
      ),
    };
  }

  private buildDelta(
    total: number,
    thisMonth: number,
    lastMonth: number,
  ): DeltaStatDto {
    const delta = thisMonth - lastMonth;
    let deltaPercent: number | null;

    if (lastMonth === 0) {
      deltaPercent = thisMonth > 0 ? null : 0;
    } else {
      deltaPercent = Math.round((delta / lastMonth) * 1000) / 10;
    }

    return { total, thisMonth, lastMonth, delta, deltaPercent };
  }

  async getChart(
    period: 'month' | 'week' = 'month',
  ): Promise<DashboardChartResponseDto> {
    const trunc = period === 'week' ? 'week' : 'month';
    const buckets = period === 'week' ? 12 : 6;

    type RawRow = { period: Date; count: bigint };

    const cutoff = Prisma.sql`DATE_TRUNC(${trunc}, NOW()) - INTERVAL '${Prisma.raw(String(buckets - 1))} ${Prisma.raw(trunc)}s'`;

    const [communicateRows, eventRows, newsRows] = await Promise.all([
      this.prisma.client.$queryRaw<RawRow[]>`
        SELECT DATE_TRUNC(${trunc}, created_at) AS period, COUNT(*) AS count
        FROM communicates
        WHERE created_at >= ${cutoff}
        GROUP BY 1 ORDER BY 1
      `,
      this.prisma.client.$queryRaw<RawRow[]>`
        SELECT DATE_TRUNC(${trunc}, created_at) AS period, COUNT(*) AS count
        FROM events
        WHERE created_at >= ${cutoff} AND deleted_at IS NULL
        GROUP BY 1 ORDER BY 1
      `,
      this.prisma.client.$queryRaw<RawRow[]>`
        SELECT DATE_TRUNC(${trunc}, created_at) AS period, COUNT(*) AS count
        FROM news
        WHERE created_at >= ${cutoff}
        GROUP BY 1 ORDER BY 1
      `,
    ]);

    const toMap = (rows: RawRow[]) =>
      new Map(rows.map((r) => [r.period.toISOString(), Number(r.count)]));

    const communicateMap = toMap(communicateRows);
    const eventMap = toMap(eventRows);
    const newsMap = toMap(newsRows);

    const allPeriods = [
      ...new Set([
        ...communicateMap.keys(),
        ...eventMap.keys(),
        ...newsMap.keys(),
      ]),
    ].sort();

    const result: ChartBucketDto[] = allPeriods.map((p) => ({
      period: p,
      communicates: communicateMap.get(p) ?? 0,
      events: eventMap.get(p) ?? 0,
      news: newsMap.get(p) ?? 0,
    }));

    return { period, buckets: result };
  }

  async getRecentActivity(limit = 10): Promise<DashboardActivityItemDto[]> {
    const take = limit * 2;
    const nestedSelect = {
      id: true,
      title: true,
      city: { select: { name: true } },
      user: { select: { name: true } },
      createdAt: true,
      updatedAt: true,
    } as const;

    const [communicates, events, news] = await Promise.all([
      this.prisma.client.communicate.findMany({
        select: nestedSelect,
        orderBy: { updatedAt: 'desc' },
        take,
      }),
      this.prisma.client.event.findMany({
        where: { deletedAt: null },
        select: nestedSelect,
        orderBy: { updatedAt: 'desc' },
        take,
      }),
      this.prisma.client.news.findMany({
        select: nestedSelect,
        orderBy: { updatedAt: 'desc' },
        take,
      }),
    ]);

    const toItem = (
      type: DashboardActivityItemDto['type'],
      r: {
        id: string;
        title: string;
        city: { name: string };
        user: { name: string } | null;
        createdAt: Date;
        updatedAt: Date;
      },
    ): DashboardActivityItemDto => ({
      id: r.id,
      type,
      title: r.title,
      cityName: r.city.name,
      createdBy: r.user?.name ?? null,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    });

    return [
      ...communicates.map((r) => toItem('communicate', r)),
      ...events.map((r) => toItem('event', r)),
      ...news.map((r) => toItem('news', r)),
    ]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit);
  }
}
