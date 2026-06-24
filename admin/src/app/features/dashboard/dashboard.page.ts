import { Component, computed, inject, signal, WritableSignal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { catchError, EMPTY, Observable } from 'rxjs';
import { DashboardApi } from './dashboard.api';
import { ActivityItem, DashboardChart, DashboardMetrics, TopCity } from './dashboard.model';
import { AuthService } from '../../core/services/auth.service';

type Period = 'week' | 'month' | 'year';

interface Slice<T> {
  loading: boolean;
  error: boolean;
  data: T | null;
}

interface StatCard {
  label: string;
  value: number;
  deltaPercent: number | null;
  icon: string;
  bubble: string;
}

interface ChartBar {
  label: string;
  total: number;
  height: number;
}

interface Shortcut {
  title: string;
  sub: string;
  route: string;
  icon: string;
  bubble: string;
}

const loadingSlice = <T>(): Slice<T> => ({ loading: true, error: false, data: null });
const emptySlice = <T>(): Slice<T> => ({ loading: false, error: false, data: null });

const SUPER_SHORTCUTS: Shortcut[] = [
  { title: 'Nova cidade', sub: 'Conectar município', route: '/cidades', icon: 'heroBuildingOffice2', bubble: 'bubble-brand' },
  { title: 'Novo administrador', sub: 'Gerenciar acessos', route: '/administradores', icon: 'heroShieldCheck', bubble: 'bubble-purple' },
  { title: 'Enviar notificação', sub: 'Alerta em massa', route: '/notificacoes', icon: 'heroBell', bubble: 'bubble-warn' },
];

const MUNICIPAL_SHORTCUTS: Shortcut[] = [
  { title: 'Novo comunicado', sub: 'Aviso oficial', route: '/comunicados', icon: 'heroMegaphone', bubble: 'bubble-brand' },
  { title: 'Criar evento', sub: 'Agende um evento municipal', route: '/eventos', icon: 'heroCalendarDays', bubble: 'bubble-purple' },
  { title: 'Nova notícia', sub: 'Cobertura jornalística', route: '/noticias', icon: 'heroNewspaper', bubble: 'bubble-accent' },
  { title: 'Adicionar local', sub: 'UBS, parques, serviços', route: '/locais', icon: 'heroMapPin', bubble: 'bubble-warn' },
];

const ACTIVITY_ACTION: Record<ActivityItem['type'], string> = {
  communicate: 'publicou o comunicado',
  event: 'criou o evento',
  news: 'publicou a notícia',
};

@Component({
  selector: 'app-dashboard-page',
  standalone: true,
  imports: [RouterLink, NgIcon],
  templateUrl: './dashboard.page.html',
  styleUrl: './dashboard.page.css',
})
export class DashboardPage {
  private readonly api = inject(DashboardApi);
  private readonly auth = inject(AuthService);

  protected readonly isSuper = this.auth.isSuperAdmin;

  protected readonly period = signal<Period>('month');
  protected readonly metrics = signal<Slice<DashboardMetrics>>(loadingSlice());
  protected readonly chart = signal<Slice<DashboardChart>>(loadingSlice());
  protected readonly activity = signal<Slice<ActivityItem[]>>(loadingSlice());
  protected readonly topCities = signal<Slice<TopCity[]>>(loadingSlice());
  protected readonly createMenuOpen = signal(false);

  protected readonly shortcuts = computed(() =>
    this.isSuper() ? SUPER_SHORTCUTS : MUNICIPAL_SHORTCUTS,
  );

  protected readonly greeting = computed(() => {
    const hour = new Date().getHours();
    const part = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    const name = this.auth.currentUser()?.name.split(' ')[0] ?? '';
    return name ? `${part}, ${name}` : part;
  });

  protected readonly subtitle = computed(() => {
    if (this.isSuper()) return 'Visão consolidada de todas as cidades conectadas.';
    const city = this.auth.currentUser()?.cityName;
    return city ? `Painel de ${city}.` : 'Painel municipal.';
  });

  protected readonly stats = computed<StatCard[] | null>(() => {
    const m = this.metrics().data;
    if (!m) return null;
    return [
      { label: 'Comunicados publicados', value: m.communicates.total, deltaPercent: m.communicates.deltaPercent, icon: 'heroMegaphone', bubble: 'bubble-brand' },
      { label: 'Eventos ativos', value: m.events.total, deltaPercent: m.events.deltaPercent, icon: 'heroCalendarDays', bubble: 'bubble-purple' },
      { label: 'Locais cadastrados', value: m.locals.total, deltaPercent: m.locals.deltaPercent, icon: 'heroMapPin', bubble: 'bubble-accent' },
      { label: 'Notificações enviadas', value: m.notifications.total, deltaPercent: m.notifications.deltaPercent, icon: 'heroBell', bubble: 'bubble-warn' },
    ];
  });

  protected readonly chartBars = computed<ChartBar[]>(() => {
    const chart = this.chart().data;
    const buckets = chart?.buckets ?? [];
    const period = chart?.period ?? this.period();
    const totals = buckets.map((b) => b.communicates + b.events + b.news);
    const max = Math.max(...totals, 1);
    return buckets.map((bucket, i) => ({
      label: this.bucketLabel(bucket.period, period),
      total: totals[i],
      height: Math.max((totals[i] / max) * 100, 3),
    }));
  });

  protected readonly chartTotal = computed(() =>
    this.chartBars().reduce((sum, bar) => sum + bar.total, 0),
  );

  protected readonly topCitiesMax = computed(() =>
    Math.max(...(this.topCities().data ?? []).map((c) => c.total), 1),
  );

  protected readonly skeletons = [0, 1, 2, 3];

  constructor() {
    if (this.isSuper()) {
      this.loadInto(this.api.getMetrics(), this.metrics);
      this.loadInto(this.api.getRecentActivity(6), this.activity);
      this.loadInto(this.api.getTopCities(6), this.topCities);
      this.loadChart();
    } else {
      this.metrics.set(emptySlice());
      this.chart.set(emptySlice());
      this.activity.set(emptySlice());
      this.topCities.set(emptySlice());
    }
  }

  setPeriod(period: Period): void {
    if (this.period() === period) return;
    this.period.set(period);
    this.loadChart();
  }

  fmt(value: number): string {
    return value.toLocaleString('pt-BR');
  }

  trendText(percent: number): string {
    const sign = percent > 0 ? '+' : '';
    return `${sign}${percent.toLocaleString('pt-BR')}%`;
  }

  activityAction(type: ActivityItem['type']): string {
    return ACTIVITY_ACTION[type];
  }

  relativeTime(iso: string): string {
    const date = new Date(iso);
    const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `Há ${minutes} min`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Há ${hours} h`;
    const days = this.calendarDaysAgo(date);
    return days === 1 ? 'Ontem' : `Há ${days} dias`;
  }

  private calendarDaysAgo(date: Date): number {
    const dayIndex = (d: Date): number => {
      const [year, month, day] = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      })
        .format(d)
        .split('-')
        .map(Number);
      return Date.UTC(year, month - 1, day) / 86_400_000;
    };
    return Math.max(1, dayIndex(new Date()) - dayIndex(date));
  }

  private readonly chartCache = new Map<Period, DashboardChart>();

  private loadChart(): void {
    const period = this.period();
    const cached = this.chartCache.get(period);
    if (cached) {
      this.chart.set({ loading: false, error: false, data: cached });
      return;
    }
    if (!this.chart().data) this.chart.set(loadingSlice());
    this.api
      .getChart(period)
      .pipe(
        catchError(() => {
          if (!this.chart().data) this.chart.set({ loading: false, error: true, data: null });
          return EMPTY;
        }),
      )
      .subscribe((data) => {
        this.chartCache.set(period, data);
        this.chart.set({ loading: false, error: false, data });
      });
  }

  private loadInto<T>(source: Observable<T>, target: WritableSignal<Slice<T>>): void {
    target.set(loadingSlice());
    source
      .pipe(
        catchError(() => {
          target.set({ loading: false, error: true, data: null });
          return EMPTY;
        }),
      )
      .subscribe((data) => target.set({ loading: false, error: false, data }));
  }

  private bucketLabel(iso: string, period: Period): string {
    const date = new Date(iso);
    if (period === 'year') return String(date.getUTCFullYear());
    // Buckets sao inicios de periodo (DATE_TRUNC, meia-noite UTC) - formatar em UTC.
    // Semana e agrupada por DATE_TRUNC('week') = sempre segunda; rotular pela data de
    // inicio da semana (dd/MM), nao pelo nome do dia (que seria "seg" em todas).
    const opts: Intl.DateTimeFormatOptions =
      period === 'week' ? { day: '2-digit', month: '2-digit' } : { month: 'short' };
    return new Intl.DateTimeFormat('pt-BR', { ...opts, timeZone: 'UTC' }).format(date).replace('.', '');
  }
}
