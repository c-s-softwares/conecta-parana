import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { DashboardApi } from './dashboard.api';
import { ActivityItem, DashboardMetrics } from './dashboard.model';

const BASE_URL = `${environment.apiUrl}/dashboard`;
const METRICS_URL = `${BASE_URL}/metrics`;
const ACTIVITY_URL = `${BASE_URL}/activity`;

const METRICS_FIXTURE: DashboardMetrics = {
  totalCities: 47,
  totalAdmins: 38,
  totalEvents: 120,
  totalNews: 55,
};

const ACTIVITY_FIXTURE: ActivityItem[] = [
  { id: 'act_1', type: 'event', description: 'Novo evento criado', createdAt: '2024-01-01T00:00:00.000Z' },
  { id: 'act_2', type: 'admin', description: 'Admin cadastrado', createdAt: '2024-01-02T00:00:00.000Z' },
];

describe('DashboardApi', () => {
  let api: DashboardApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(DashboardApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  describe('getMetrics', () => {
    it('deve fazer GET para /dashboard/metrics', () => {
      let received: DashboardMetrics | undefined;
      api.getMetrics().subscribe((r) => (received = r));

      const req = http.expectOne(METRICS_URL);
      expect(req.request.method).toBe('GET');
      req.flush(METRICS_FIXTURE);
      expect(received).toEqual(METRICS_FIXTURE);
    });
  });

  describe('getRecentActivity', () => {
    it('deve fazer GET com limit padrão 10', () => {
      api.getRecentActivity().subscribe();

      const req = http.expectOne((r) => r.url === ACTIVITY_URL);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.get('limit')).toBe('10');
      req.flush(ACTIVITY_FIXTURE);
    });

    it('deve fazer GET com limit personalizado', () => {
      api.getRecentActivity(5).subscribe();

      const req = http.expectOne((r) => r.url === ACTIVITY_URL);
      expect(req.request.params.get('limit')).toBe('5');
      req.flush([]);
    });

    it('deve retornar array de ActivityItem tipado', () => {
      let received: ActivityItem[] | undefined;
      api.getRecentActivity().subscribe((r) => (received = r));

      http.expectOne((r) => r.url === ACTIVITY_URL).flush(ACTIVITY_FIXTURE);
      expect(received).toEqual(ACTIVITY_FIXTURE);
    });
  });
});
