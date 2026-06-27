import { Component, computed, contentChild, input, output, TemplateRef } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NgIcon } from '@ng-icons/core';
import { LoadingSkeleton } from '../loading-skeleton/loading-skeleton';
import { EmptyState } from '../empty-state/empty-state';

export interface DataListPageEvent {
  page: number;
  pageSize: number;
}

/**
 * Casca de listagem dos CRUDs: dona os estados loading/empty, a paginacao
 * server-side e o container de cards. A linha de cada item e definida pelo
 * consumidor via <ng-template #row let-item> (padrao list-item do design).
 */
@Component({
  selector: 'app-data-list',
  standalone: true,
  imports: [NgTemplateOutlet, NgIcon, LoadingSkeleton, EmptyState],
  templateUrl: './data-list.html',
})
export class DataList {
  items = input.required<Record<string, unknown>[]>();
  total = input<number>(0);
  page = input<number>(1);
  pageSize = input<number>(10);
  loading = input<boolean>(false);
  emptyTitle = input<string>('Nenhum item encontrado');
  emptyDescription = input<string>('');
  emptyIcon = input<string>('');
  trackBy = input<string>('id');

  pageChange = output<DataListPageEvent>();

  protected readonly rowTemplate = contentChild.required<TemplateRef<unknown>>('row');

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );
  protected readonly startItem = computed(() =>
    this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize() + 1,
  );
  protected readonly endItem = computed(() =>
    Math.min(this.page() * this.pageSize(), this.total()),
  );

  protected readonly pages = computed<number[]>(() => {
    const current = this.page();
    const total = this.totalPages();
    const range: number[] = [];
    const maxVisible = 5;

    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) range.push(i);
      return range;
    }

    range.push(1);
    let start = Math.max(2, current - 1);
    let end = Math.min(total - 1, current + 1);
    if (current <= 2) end = 4;
    else if (current >= total - 1) start = total - 3;

    if (start > 2) range.push(-1);
    for (let i = start; i <= end; i++) range.push(i);
    if (end < total - 1) range.push(-2);
    range.push(total);
    return range;
  });

  protected changePage(newPage: number): void {
    if (newPage < 1 || newPage > this.totalPages() || newPage === this.page()) return;
    this.pageChange.emit({ page: newPage, pageSize: this.pageSize() });
  }
}
