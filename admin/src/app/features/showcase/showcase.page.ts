import { Component, computed, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { DataList, DataListPageEvent } from '../../shared/components/data-list/data-list';
import { ModalDialog } from '../../shared/components/modal-dialog/modal-dialog';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { EmptyState } from '../../shared/components/empty-state/empty-state';
import { LoadingSkeleton } from '../../shared/components/loading-skeleton/loading-skeleton';
import { FormField } from '../../shared/components/form-field/form-field';

interface DemoRow extends Record<string, unknown> {
  id: string;
  name: string;
  city: string;
  category: string;
  active: boolean;
  createdAt: string;
}

const CITIES = ['Curitiba', 'Londrina', 'Maringá', 'Foz do Iguaçu'];
const CATEGORIES = ['Saúde', 'Educação', 'Cultura', 'Lazer'];

const DEMO_ROWS: DemoRow[] = Array.from({ length: 23 }, (_, i) => ({
  id: String(i + 1),
  name: `Local ${String.fromCharCode(65 + (i % 26))}${i + 1}`,
  city: CITIES[i % CITIES.length],
  category: CATEGORIES[i % CATEGORIES.length],
  active: i % 3 !== 0,
  createdAt: new Date(2026, 0, (i % 28) + 1).toLocaleDateString('pt-BR'),
}));

@Component({
  selector: 'app-showcase-page',
  standalone: true,
  imports: [ReactiveFormsModule, NgIcon, DataList, ModalDialog, ConfirmDialog, EmptyState, LoadingSkeleton, FormField],
  templateUrl: './showcase.page.html',
})
export class ShowcasePage {
  private readonly fb = new FormBuilder();

  // --- DataList ---
  protected readonly pageSize = 5;
  protected readonly page = signal(1);
  protected readonly loading = signal(false);
  protected readonly forceEmpty = signal(false);

  protected readonly rows = computed<DemoRow[]>(() => {
    if (this.forceEmpty()) return [];
    const start = (this.page() - 1) * this.pageSize;
    return DEMO_ROWS.slice(start, start + this.pageSize);
  });
  protected readonly total = computed(() => (this.forceEmpty() ? 0 : DEMO_ROWS.length));
  protected readonly lastAction = signal<string>('nenhuma');

  protected onPage(e: DataListPageEvent): void {
    this.page.set(e.page);
  }

  protected onEdit(row: DemoRow): void {
    this.lastAction.set(`editar -> ${row.name}`);
  }

  protected askDelete(row: DemoRow): void {
    this.pendingDelete.set(row);
    this.confirmOpen.set(true);
  }

  protected toggleLoading(): void {
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), 1500);
  }

  // --- ModalDialog ---
  protected readonly modalOpen = signal(false);
  protected readonly modalSize = signal<'s' | 'm' | 'l'>('m');
  protected readonly form = this.fb.group({
    name: ['', Validators.required],
  });

  protected openModal(size: 's' | 'm' | 'l'): void {
    this.modalSize.set(size);
    this.form.reset();
    this.modalOpen.set(true);
  }

  protected saveModal(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.lastModalResult.set(`Salvo: ${this.form.value.name}`);
    this.modalOpen.set(false);
  }

  protected readonly lastModalResult = signal<string>('nada salvo ainda');

  // --- ConfirmDialog ---
  protected readonly confirmOpen = signal(false);
  protected readonly pendingDelete = signal<DemoRow | null>(null);
  protected readonly lastConfirm = signal<string>('aguardando');

  protected confirmDelete(): void {
    this.lastConfirm.set(`excluído -> ${this.pendingDelete()?.name ?? ''}`);
    this.confirmOpen.set(false);
  }

  // --- FormField file ---
  protected readonly uploadedFiles = signal<string[]>([]);

  protected onFiles(files: File[]): void {
    this.uploadedFiles.set(files.map((f) => f.name));
  }
}
