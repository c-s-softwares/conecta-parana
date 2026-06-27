export interface DeltaStat {
  total: number;
  thisMonth: number;
  lastMonth: number;
  delta: number;
  deltaPercent: number | null;
}

export interface DashboardMetrics {
  communicates: DeltaStat;
  events: DeltaStat;
  locals: DeltaStat;
  notifications: DeltaStat;
}

export interface ActivityItem {
  id: string;
  type: 'communicate' | 'event' | 'news';
  title: string;
  cityName: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChartBucket {
  period: string;
  communicates: number;
  events: number;
  news: number;
}

export interface DashboardChart {
  period: 'week' | 'month' | 'year';
  buckets: ChartBucket[];
}

export interface TopCity {
  cityId: string;
  cityName: string;
  total: number;
}
