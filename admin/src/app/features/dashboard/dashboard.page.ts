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
    const buckets = this.chart().data?.buckets ?? [];
    const totals = buckets.map((b) => b.communicates + b.events + b.news);
    const max = Math.max(...totals, 1);
    return buckets.map((bucket, i) => ({
      label: this.bucketLabel(bucket.period),
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
    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.round(diffMs / 60000);
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `Há ${minutes} min`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `Há ${hours} h`;
    const days = Math.round(hours / 24);
    return `Há ${days} d`;
  }

  private loadChart(): void {
    this.loadInto(this.api.getChart(this.period()), this.chart);
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

  private bucketLabel(iso: string): string {
    const date = new Date(iso);
    if (this.period() === 'year') return String(date.getFullYear());
    const unit = this.period() === 'week' ? { weekday: 'short' as const } : { month: 'short' as const };
    return new Intl.DateTimeFormat('pt-BR', { ...unit, timeZone: 'UTC'}).format(date).replace('.', '');
  }
}
