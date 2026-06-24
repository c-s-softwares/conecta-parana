import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { of, throwError } from 'rxjs';

import { DashboardPage } from './dashboard.page';
import { DashboardApi } from './dashboard.api';
import { AuthService } from '../../core/services/auth.service';
import { AuthUser } from '../../core/services/auth.model';
import { ActivityItem, DashboardChart, DashboardMetrics, TopCity } from './dashboard.model';

const metricsData: DashboardMetrics = {
  communicates: { total: 86, thisMonth: 8, lastMonth: 7, delta: 1, deltaPercent: 8.2 },
  events: { total: 34, thisMonth: 4, lastMonth: 5, delta: -1, deltaPercent: -4.2 },
  locals: { total: 210, thisMonth: 18, lastMonth: 0, delta: 18, deltaPercent: null },
  notifications: { total: 1284, thisMonth: 10, lastMonth: 11, delta: -1, deltaPercent: -3.1 },
};
const chartData: DashboardChart = {
  period: 'month',
  buckets: [{ period: '2026-05-01T00:00:00.000Z', communicates: 3, events: 1, news: 2 }],
};
const activityData: ActivityItem[] = [
  {
    id: 'a1',
    type: 'event',
    title: 'Feira cultural',
    cityName: 'Maringá',
    createdBy: 'Ana',
    createdAt: '2026-06-23T00:00:00.000Z',
    updatedAt: '2026-06-23T00:00:00.000Z',
  },
];
const topCitiesData: TopCity[] = [{ cityId: 'c1', cityName: 'Maringá', total: 42 }];

const superUser: AuthUser = {
  id: 'u2',
  name: 'Bia Souza',
  email: 'bia@conecta.local',
  role: 'ADMIN',
  cityId: null,
  cityName: null,
};
const municipalUser: AuthUser = {
  id: 'u1',
  name: 'Ana Lima',
  email: 'ana@conecta.local',
  role: 'ADMIN',
  cityId: 'cit_maringa',
  cityName: 'Maringá',
};

describe('DashboardPage', () => {
  const isSuper = signal(false);
  const currentUser = signal<AuthUser | null>(superUser);
  const api = {
    getMetrics: vi.fn(),
    getRecentActivity: vi.fn(),
    getTopCities: vi.fn(),
    getChart: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    isSuper.set(false);
    currentUser.set(superUser);
    api.getMetrics.mockReturnValue(of(metricsData));
    api.getRecentActivity.mockReturnValue(of(activityData));
    api.getTopCities.mockReturnValue(of(topCitiesData));
    api.getChart.mockReturnValue(of(chartData));

    await TestBed.configureTestingModule({
      imports: [DashboardPage, RouterModule.forRoot([])],
      providers: [
        { provide: DashboardApi, useValue: api },
        { provide: AuthService, useValue: { isSuperAdmin: isSuper, currentUser } },
      ],
    }).compileComponents();
  });

  afterEach(() => vi.restoreAllMocks());

  const render = (): ComponentFixture<DashboardPage> => {
    const fixture = TestBed.createComponent(DashboardPage);
    fixture.detectChanges();
    return fixture;
  };

  it('Super Admin: renderiza 4 cards, top cidades e atividade', () => {
    isSuper.set(true);
    const fixture = render();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelectorAll('.stat-card')).toHaveLength(4);
    expect(el.textContent).toContain('Comunicados publicados');
    expect(el.textContent).toContain('1.284');
    expect(el.querySelector('.city-row')?.textContent).toContain('Maringá');
    expect(el.querySelector('.activity-item')?.textContent).toContain('Feira cultural');
  });

  it('troca de período e abre o menu de criação', () => {
    isSuper.set(true);
    const fixture = render();
    const component = fixture.componentInstance;

    component.setPeriod('week');
    component.setPeriod('year');
    expect(api.getChart).toHaveBeenCalledWith('year');

    component['createMenuOpen'].set(true);
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('.create-menu')).toBeTruthy();
  });

  it('ADMIN municipal: não chama nenhum endpoint de /dashboard', () => {
    isSuper.set(false);
    currentUser.set(municipalUser);
    const fixture = render();

    expect(api.getMetrics).not.toHaveBeenCalled();
    expect(api.getChart).not.toHaveBeenCalled();
    expect(api.getRecentActivity).not.toHaveBeenCalled();
    expect((fixture.nativeElement as HTMLElement).querySelector('.city-row')).toBeNull();
  });

  it('falha isolada em um card: metrics mostra "--", demais painéis seguem', () => {
    isSuper.set(true);
    api.getMetrics.mockReturnValue(throwError(() => new Error('boom')));
    const fixture = render();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.stat-value')?.textContent?.trim()).toBe('--');
    expect(el.querySelector('.city-row')?.textContent).toContain('Maringá');
  });

  it('shortcuts são específicos por papel', () => {
    isSuper.set(true);
    const sup = render().componentInstance;
    expect(sup['shortcuts']().map((s) => s.route)).toEqual(['/cidades', '/administradores', '/notificacoes']);
  });

  it('relativeTime conta dias de calendário no fuso do Brasil (GMT-3)', () => {
    vi.setSystemTime(new Date('2026-06-24T12:00:00-03:00'));
    const c = render().componentInstance;

    expect(c.relativeTime('2026-06-22T22:00:00-03:00')).toBe('Há 2 dias');
    expect(c.relativeTime('2026-06-23T06:00:00-03:00')).toBe('Ontem');
    expect(c.relativeTime('2026-06-24T09:30:00-03:00')).toBe('Há 2 h');

    vi.useRealTimers();
  });
});
