import { Component, computed, input, output, signal } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { LoadingSkeleton } from '../loading-skeleton/loading-skeleton'; 
import { EmptyState } from '../empty-state/empty-state'; 

export interface DataTableColumn {
  key: string;
  label: string;
  sortable?: boolean;
  width?: string;
}

export interface DataTableSortEvent {
  column: string;
  direction: 'asc' | 'desc' | '';
}

export interface DataTableActionEvent<T = Record<string, unknown>> {
  action: string;
  item: T;
}

export interface DataTablePageEvent {
  page: number;
  pageSize: number;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [NgIcon, LoadingSkeleton, EmptyState],
  templateUrl: './data-table.html',
})
export class DataTable {

  columns = input.required<DataTableColumn[]>();
  items = input.required<Record<string, unknown>[]>();
  total = input<number>(0);
  page = input<number>(1);
  pageSize = input<number>(10);
  loading = input<boolean>(false);
  actions = input<string[]>([]);
  emptyTitle = input<string>('Nenhum item encontrado');
  emptyDescription = input<string>('');
  trackBy = input<string>('id');
  pageChange = output<DataTablePageEvent>();
  sort = output<DataTableSortEvent>();
  action = output<DataTableActionEvent>();

  protected sortColumn = signal<string>('');
  protected sortDirection = signal<'asc' | 'desc' | ''>('');

  protected totalPages = computed(() => Math.max(1, Math.ceil(this.total() / this.pageSize())));
  protected startItem = computed(() => {
    if (this.total() === 0) return 0;
    return (this.page() - 1) * this.pageSize() + 1;
  });
  protected endItem = computed(() => Math.min(this.page() * this.pageSize(), this.total()));

  protected pages = computed<number[]>(() => {
    const current = this.page();
    const total = this.totalPages();
    const range: number[] = [];
    const maxVisible = 5;

    if (total <= maxVisible) {
      for (let i = 1; i <= total; i++) range.push(i);
    } else {
      range.push(1);

      let start = Math.max(2, current - 1);
      let end = Math.min(total - 1, current + 1);

      if (current <= 2) {
        end = 4;
      } else if (current >= total - 1) {
        start = total - 3;
      }

      if (start > 2) {
        range.push(-1);
      }

      for (let i = start; i <= end; i++) {
        range.push(i);
      }

      if (end < total - 1) {
        range.push(-2);
      }

      range.push(total);
    }

    return range;
  });


  protected onSort(col: DataTableColumn): void {
    if (!col.sortable) return;

    let nextDir: 'asc' | 'desc' | '';
    if (this.sortColumn() === col.key) {
      if (this.sortDirection() === 'asc') nextDir = 'desc';
      else if (this.sortDirection() === 'desc') nextDir = '';
      else nextDir = 'asc';
    } else {
      nextDir = 'asc';
    }

    this.sortColumn.set(nextDir ? col.key : '');
    this.sortDirection.set(nextDir);

    this.sort.emit({ column: this.sortColumn(), direction: this.sortDirection() });
  }

  protected changePage(newPage: number): void {
    if (newPage < 1 || newPage > this.totalPages() || newPage === this.page()) return;
    this.pageChange.emit({ page: newPage, pageSize: this.pageSize() });
  }

  protected onActionClick(actionName: string, item: Record<string, unknown>): void {
    this.action.emit({ action: actionName, item });
  }

  protected getActionLabel(action: string): string {
    if (action === 'edit') return 'Editar';
    if (action === 'delete') return 'Excluir';
    return action;
  }

  protected getActionClass(action: string): string {
    if (action === 'edit') {
      return 'rounded-md bg-blue-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300';
    }
    if (action === 'delete') {
      return 'rounded-md bg-red-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-red-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-300';
    }
    return 'rounded-md bg-gray-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-gray-600 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-gray-300';
  }
}
