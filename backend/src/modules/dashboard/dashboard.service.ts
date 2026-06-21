import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import {
  DashboardMetricsResponseDto,
  DeltaStatDto,
} from './dto/response/dashboard-metrics-response.dto';

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
}
