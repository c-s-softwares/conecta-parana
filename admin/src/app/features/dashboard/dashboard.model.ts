export interface DashboardMetrics {
  totalCities: number;
  totalAdmins: number;
  totalEvents: number;
  totalNews: number;
}

export interface ActivityItem {
  id: string;
  type: 'event' | 'news' | 'admin';
  description: string;
  createdAt: string;
}
