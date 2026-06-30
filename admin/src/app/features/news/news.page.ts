import { Component, inject, OnInit, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { merge } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { DatePipe } from '@angular/common';
import { NgIcon } from '@ng-icons/core';

import { DataList } from '../../shared/components/data-list/data-list';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { ToastService } from '../../core/services/toast.service';
import { AppError } from '../../core/interceptors/app-error';
import { NewsApi } from './news.api';
import { NewsItem } from './news.model';
import { NewsFormModal } from './news-form-modal';

@Component({
  selector: 'app-news-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DataList,
    ConfirmDialog,
    NewsFormModal,
    DatePipe,
    NgIcon,
  ],
  templateUrl: './news.page.html',
})
export class NewsPage implements OnInit {
  private readonly newsApi = inject(NewsApi);
  private readonly toast = inject(ToastService);

  readonly items = signal<NewsItem[]>([]);
  readonly deletingItem = signal<NewsItem | null>(null);

  readonly page = signal(1);
  readonly pageSize = signal(10);
  readonly totalItems = signal(0);
  readonly loading = signal(false);

  readonly formOpen = signal(false);
  readonly selectedItem = signal<NewsItem | null>(null);

  protected readonly showFilters = signal(false);
  protected readonly selectedLinkTypeTab = signal<
    'todas' | 'interno' | 'externo'
  >('todas');
  protected readonly searchControl = new FormControl('');
  protected readonly typeFilterControl = new FormControl('');
  protected readonly statusFilterControl = new FormControl('');

  ngOnInit(): void {
    this.loadNews();

    merge(
      this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()),
      this.typeFilterControl.valueChanges,
      this.statusFilterControl.valueChanges,
    ).subscribe(() => {
      this.page.set(1);
      this.loadNews();
    });
  }

  loadNews(): void {
    this.loading.set(true);
    const filters = {
      type: this.typeFilterControl.value || undefined,
      isActive:
        this.statusFilterControl.value === 'true'
          ? true
          : this.statusFilterControl.value === 'false'
            ? false
            : undefined,
      linkType:
        this.selectedLinkTypeTab() !== 'todas'
          ? this.selectedLinkTypeTab()
          : undefined,
    };

    this.newsApi
      .list({
        page: this.page(),
        pageSize: this.pageSize(),
        search: this.searchControl.value || undefined,
        filters,
      })
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.totalItems.set(res.total);
          this.loading.set(false);
        },
        error: () => {
          this.toast.show('error', 'Erro ao carregar notícias.');
          this.loading.set(false);
        },
      });
  }

  onPageChange(event: { page: number; pageSize: number }): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
    this.loadNews();
  }

  toggleFilters(): void {
    this.showFilters.update((v) => !v);
  }

  setLinkTypeTab(tab: 'todas' | 'interno' | 'externo'): void {
    this.selectedLinkTypeTab.set(tab);
    this.page.set(1);
    this.loadNews();
  }

  openCreate(): void {
    this.selectedItem.set(null);
    this.formOpen.set(true);
  }

  openEdit(item: NewsItem): void {
    this.selectedItem.set(item);
    this.formOpen.set(true);
  }

  onFormSaved(): void {
    this.formOpen.set(false);
    this.selectedItem.set(null);
    this.loadNews();
  }

  onFormClosed(): void {
    this.formOpen.set(false);
    this.selectedItem.set(null);
  }

  confirmDelete(item: NewsItem): void {
    this.deletingItem.set(item);
  }

  cancelDelete(): void {
    this.deletingItem.set(null);
  }

  executeDelete(): void {
    const item = this.deletingItem();
    if (!item) return;

    this.newsApi.delete(item.id).subscribe({
      next: () => {
        this.toast.show('success', 'Notícia excluída com sucesso.');
        this.loadNews();
        this.deletingItem.set(null);
      },
      error: (err: AppError) => {
        this.deletingItem.set(null);
        if (err.status === 404) {
          this.toast.show(
            'error',
            'Notícia não encontrada. Pode ter sido excluída por outro admin.',
          );
          this.loadNews();
        }
      },
    });
  }
}
