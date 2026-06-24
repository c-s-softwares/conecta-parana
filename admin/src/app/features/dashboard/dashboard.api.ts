import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ActivityItem, DashboardMetrics } from './dashboard.model';

@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/dashboard`;

  getMetrics(): Observable<DashboardMetrics> {
    return this.http.get<DashboardMetrics>(`${this.baseUrl}/metrics`);
  }

  getRecentActivity(limit = 10): Observable<ActivityItem[]> {
    const params = new HttpParams().set('limit', limit);
    return this.http.get<ActivityItem[]>(`${this.baseUrl}/activity`, { params });
  }
}
