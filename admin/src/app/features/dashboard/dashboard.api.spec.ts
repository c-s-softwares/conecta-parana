import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { DashboardApi } from './dashboard.api';
import {
  ActivityItem,
  DashboardChart,
  DashboardMetrics,
  TopCity,
} from './dashboard.model';

const BASE_URL = `${environment.apiUrl}/dashboard`;
const METRICS_URL = `${BASE_URL}/metrics`;
const ACTIVITY_URL = `${BASE_URL}/activity`;
const CHART_URL = `${BASE_URL}/chart`;
const TOP_CITIES_URL = `${BASE_URL}/top-cities`;

const METRICS_FIXTURE: DashboardMetrics = {
  communicates: { total: 86, thisMonth: 8, lastMonth: 7, delta: 1, deltaPercent: 8.2 },
  events: { total: 34, thisMonth: 4, lastMonth: 5, delta: -1, deltaPercent: -4.2 },
  locals: { total: 210, thisMonth: 18, lastMonth: 0, delta: 18, deltaPercent: null },
  notifications: { total: 1284, thisMonth: 10, lastMonth: 11, delta: -1, deltaPercent: -3.1 },
};

const ACTIVITY_FIXTURE: ActivityItem[] = [
  {
    id: 'act_1',
    type: 'event',
    title: 'Feira cultural',
    cityName: 'Maringá',
    createdBy: 'Ana',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

const CHART_FIXTURE: DashboardChart = {
  period: 'month',
  buckets: [{ period: '2026-05-01T00:00:00.000Z', communicates: 3, events: 1, news: 2 }],
};

const TOP_CITIES_FIXTURE: TopCity[] = [{ cityId: 'cit_1', cityName: 'Maringá', total: 42 }];

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

  it('getMetrics faz GET para /dashboard/metrics', () => {
    let received: DashboardMetrics | undefined;
    api.getMetrics().subscribe((r) => (received = r));

    const req = http.expectOne(METRICS_URL);
    expect(req.request.method).toBe('GET');
    req.flush(METRICS_FIXTURE);
    expect(received).toEqual(METRICS_FIXTURE);
  });

  it('getRecentActivity usa limit padrão 10 e retorna ActivityItem[]', () => {
    let received: ActivityItem[] | undefined;
    api.getRecentActivity().subscribe((r) => (received = r));

    const req = http.expectOne((r) => r.url === ACTIVITY_URL);
    expect(req.request.params.get('limit')).toBe('10');
    req.flush(ACTIVITY_FIXTURE);
    expect(received).toEqual(ACTIVITY_FIXTURE);
  });

  it('getChart envia o período e retorna os buckets', () => {
    let received: DashboardChart | undefined;
    api.getChart('year').subscribe((r) => (received = r));

    const req = http.expectOne((r) => r.url === CHART_URL);
    expect(req.request.params.get('period')).toBe('year');
    req.flush(CHART_FIXTURE);
    expect(received).toEqual(CHART_FIXTURE);
  });

  it('getTopCities usa limit padrão 6 e retorna TopCity[]', () => {
    let received: TopCity[] | undefined;
    api.getTopCities().subscribe((r) => (received = r));

    const req = http.expectOne((r) => r.url === TOP_CITIES_URL);
    expect(req.request.params.get('limit')).toBe('6');
    req.flush(TOP_CITIES_FIXTURE);
    expect(received).toEqual(TOP_CITIES_FIXTURE);
  });
});
