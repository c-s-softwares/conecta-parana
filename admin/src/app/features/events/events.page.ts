import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  DataList,
  DataListPageEvent,
} from '../../shared/components/data-list/data-list';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { ToastService } from '../../core/services/toast.service';
import { EventsApi } from './events.api';
import { EventFormModal } from './event-form-modal';
import { EventItem, EventOrder } from './events.model';

type StatusFilter = 'all' | 'active' | 'inactive';

@Component({
  selector: 'app-events-page',
  standalone: true,
  imports: [DataList, ConfirmDialog, EventFormModal, NgIcon, DatePipe],
  templateUrl: './events.page.html',
})
export class EventsPage {
  private readonly api = inject(EventsApi);
  private readonly toast = inject(ToastService);

  protected readonly items = signal<EventItem[]>([]);
  protected readonly total = signal(0);
  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly loading = signal(false);

  protected readonly search = signal('');
  protected readonly statusFilter = signal<StatusFilter>('all');
  protected readonly order = signal<EventOrder>('date_asc');

  protected readonly pendingDelete = signal<EventItem | null>(null);
  protected readonly formOpen = signal(false);
  protected readonly editing = signal<EventItem | null>(null);

  private readonly searchInput$ = new Subject<string>();

  constructor() {
    this.searchInput$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((term) => {
        this.search.set(term);
        this.page.set(1);
        this.load();
      });

    this.load();
  }

  protected onSearch(value: string): void {
    this.searchInput$.next(value);
  }

  protected setStatus(filter: StatusFilter): void {
    if (this.statusFilter() === filter) return;
    this.statusFilter.set(filter);
    this.page.set(1);
    this.load();
  }

  protected toggleOrder(): void {
    this.order.update((current) =>
      current === 'date_asc' ? 'date_desc' : 'date_asc',
    );
    this.page.set(1);
    this.load();
  }

  protected onPage(event: DataListPageEvent): void {
    this.page.set(event.page);
    this.load();
  }

  protected onCreate(): void {
    this.editing.set(null);
    this.formOpen.set(true);
  }

  protected onEdit(event: EventItem): void {
    this.editing.set(event);
    this.formOpen.set(true);
  }

  protected onFormSaved(): void {
    this.formOpen.set(false);
    this.load();
  }

  protected closeForm(): void {
    this.formOpen.set(false);
  }

  protected askDelete(event: EventItem): void {
    this.pendingDelete.set(event);
  }

  protected cancelDelete(): void {
    this.pendingDelete.set(null);
  }

  protected confirmDelete(): void {
    const target = this.pendingDelete();
    if (!target) return;

    this.api.delete(target.id).subscribe({
      next: () => {
        this.toast.show('success', 'Evento excluído.');
        this.pendingDelete.set(null);
        this.load();
      },
      error: () => this.pendingDelete.set(null),
    });
  }

  private load(): void {
    this.loading.set(true);
    const status = this.statusFilter();
    const isActive = status === 'all' ? undefined : status === 'active';

    this.api
      .list({
        page: this.page(),
        pageSize: this.pageSize(),
        search: this.search() || undefined,
        filters: { isActive, order: this.order() },
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.total.set(res.total);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
}
