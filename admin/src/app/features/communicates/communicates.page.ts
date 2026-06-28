import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { catchError, EMPTY, finalize } from 'rxjs';

import { ToastService } from '../../core/services/toast.service';
import { FormField } from '../../shared/components/form-field/form-field';
import { ModalDialog } from '../../shared/components/modal-dialog/modal-dialog';
import { ComunicadosApi } from './communicates.api';
import { ComunicadoItem, CreateCommunicateDto } from './communicates.model';
import { DataList, DataListPageEvent } from '../../shared/components/data-list/data-list';

@Component({
  selector: 'app-communicates-page',
  standalone: true,
  imports: [CommonModule, FormsModule, NgIcon, ModalDialog, FormField, DataList],
  templateUrl: './communicates.page.html',
  styleUrl: './communicates.page.css',
})
export class CommunicatesPage {
  private readonly api = inject(ComunicadosApi);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly items = signal<ComunicadoItem[]>([]);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly deletingId = signal<string | null>(null);

  protected readonly page = signal(1);
  protected readonly pageSize = signal(10);
  protected readonly total = signal(0);

  protected readonly search = signal('');
  protected readonly isActive = signal<string>('');

  protected readonly modalOpen = signal(false);
  protected readonly editing = signal<ComunicadoItem | null>(null);

  protected readonly form = signal<CreateCommunicateDto>({
    title: '',
    description: '',
    isActive: true,
  });

  protected readonly submitted = signal(false);

  protected readonly modalTitle = computed(() =>
    this.editing() ? 'Editar comunicado' : 'Novo comunicado',
  );

  protected readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );

  protected readonly canPrev = computed(() => this.page() > 1);
  protected readonly canNext = computed(() => this.page() < this.totalPages());

  constructor() {
    const initialIsActive = this.route.snapshot.queryParamMap.get('isActive');
    if (initialIsActive === 'true' || initialIsActive === 'false') {
      this.isActive.set(initialIsActive);
    }

    this.load();
  }

  protected load(): void {
    this.loading.set(true);

    const active = this.isActive();

    this.api
      .list({
        page: this.page(),
        pageSize: this.pageSize(),
        search: this.search().trim(),
        filters: {
          isActive: active === '' ? undefined : active === 'true',
        },
      })
      .pipe(
        catchError(() => {
          this.toast.show('error', 'Não foi possível carregar os comunicados.');
          return EMPTY;
        }),
        finalize(() => this.loading.set(false)),
      )
      .subscribe((response) => {
        this.items.set(response.items);
        this.total.set(response.total);
        this.page.set(response.page);
        this.pageSize.set(response.pageSize);
      });
  }

  protected applyFilters(): void {
    this.page.set(1);
    this.updateQueryString();
    this.load();
  }

  protected clearFilters(): void {
    this.search.set('');
    this.isActive.set('');
    this.page.set(1);
    this.updateQueryString();
    this.load();
  }

  protected prevPage(): void {
    if (!this.canPrev()) return;
    this.page.update((value) => value - 1);
    this.load();
  }

  protected nextPage(): void {
    if (!this.canNext()) return;
    this.page.update((value) => value + 1);
    this.load();
  }

  protected openCreate(): void {
    this.submitted.set(false);
    this.editing.set(null);
    this.form.set({
      title: '',
      description: '',
      isActive: true,
    });
    this.modalOpen.set(true);
  }

  protected openEdit(item: ComunicadoItem): void {
    this.submitted.set(false);
    this.editing.set(item);
    this.form.set({
      title: item.title,
      description: item.description,
      isActive: item.isActive,
    });
    this.modalOpen.set(true);
  }

  protected closeModal(): void {
    if (this.saving()) return;
    this.modalOpen.set(false);
  }

  protected updateForm<K extends keyof CreateCommunicateDto>(
    key: K,
    value: CreateCommunicateDto[K],
  ): void {
    this.form.update((current) => ({ ...current, [key]: value }));
  }

  protected save(): void {
    this.submitted.set(true);

    if (!this.isFormValid()) return;

    this.saving.set(true);

    const current = this.editing();
    const dto = this.form();

    const request = current
      ? this.api.update(current.id, dto)
      : this.api.create(dto);

    request
      .pipe(
        catchError((error) => {
          this.handleWriteError(error);
          return EMPTY;
        }),
        finalize(() => this.saving.set(false)),
      )
      .subscribe(() => {
        this.toast.show(
          'success',
          current ? 'Comunicado atualizado com sucesso.' : 'Comunicado criado com sucesso.',
        );
        this.modalOpen.set(false);
        this.load();
      });
  }

  protected onPageChange(event: DataListPageEvent): void {
  this.page.set(event.page);
  this.pageSize.set(event.pageSize);
  this.load();
}

  protected delete(item: ComunicadoItem): void {
    if (!confirm(`Excluir o comunicado "${item.title}"?`)) return;

    this.deletingId.set(item.id);

    this.api
      .delete(item.id)
      .pipe(
        catchError((error) => {
          this.handleWriteError(error);
          return EMPTY;
        }),
        finalize(() => this.deletingId.set(null)),
      )
      .subscribe(() => {
        this.toast.show('success', 'Comunicado excluído com sucesso.');
        this.load();
      });
  }

  protected titleError(): string {
    const title = this.form().title.trim();
    if (!title) return 'Informe o título.';
    if (title.length < 5) return 'O título deve ter pelo menos 5 caracteres.';
    if (title.length > 200) return 'O título deve ter no máximo 200 caracteres.';
    return '';
  }

  protected descriptionError(): string {
    const description = this.form().description.trim();
    if (!description) return 'Informe a descrição.';
    if (description.length < 10) return 'A descrição deve ter pelo menos 10 caracteres.';
    return '';
  }

  private isFormValid(): boolean {
    return !this.titleError() && !this.descriptionError();
  }

  private updateQueryString(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        isActive: this.isActive() || null,
      },
      queryParamsHandling: 'merge',
    });
  }

  private handleWriteError(error: unknown): void {
    const code = this.extractErrorCode(error);

    if (code === 'city_scope_denied') {
      this.toast.show('error', 'Você só pode atuar na sua cidade.');
      this.modalOpen.set(false);
      this.load();
      return;
    }

    if (code === 'comunicado_not_found') {
      this.toast.show(
        'error',
        'Comunicado não encontrado. Pode ter sido excluído por outro admin.',
      );
      this.modalOpen.set(false);
      this.load();
      return;
    }

    this.toast.show('error', 'Não foi possível salvar o comunicado.');
  }

  private extractErrorCode(error: unknown): string | null {
    if (!error || typeof error !== 'object') return null;

    const maybe = error as {
      error?: {
        code?: string;
        errorCode?: string;
        message?: string;
      };
    };

    return maybe.error?.code ?? maybe.error?.errorCode ?? maybe.error?.message ?? null;
  }
}
