import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIcon } from '@ng-icons/core';
import { Observable, catchError, EMPTY, finalize, forkJoin, of } from 'rxjs';

import { ToastService } from '../../core/services/toast.service';
import { AuthService } from '../../core/services/auth.service';
import { FormField } from '../../shared/components/form-field/form-field';
import { ModalDialog } from '../../shared/components/modal-dialog/modal-dialog';
import { ComunicadosApi } from './communicates.api';
import { CommunicatePhoto, ComunicadoItem, CreateCommunicateDto } from './communicates.model';
import { DataList, DataListPageEvent } from '../../shared/components/data-list/data-list';
import { UploadsApi } from '../../core/services/uploads.api';

const MAX_PHOTOS = 10;

interface PendingFile {
  file: File;
  previewUrl: string;
}

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
  private readonly auth = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly uploads = inject(UploadsApi);

  protected readonly maxPhotos = MAX_PHOTOS;

  private readonly existingPhotos = signal<CommunicatePhoto[]>([]);
  private readonly removedIds = signal<string[]>([]);
  protected readonly newFiles = signal<PendingFile[]>([]);

  protected readonly visiblePhotos = computed(() =>
    this.existingPhotos().filter((photo) => !this.removedIds().includes(photo.id)),
  );
  protected readonly totalPhotos = computed(
    () => this.visiblePhotos().length + this.newFiles().length,
  );

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
    const cityId = this.auth.currentUser()?.cityId ?? undefined;

    this.api
      .list({
        page: this.page(),
        pageSize: this.pageSize(),
        search: this.search().trim(),
        filters: {
          isActive: active === '' ? undefined : active === 'true',
          cityId,
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
    this.clearNewFiles();
    this.removedIds.set([]);
    this.existingPhotos.set([]);
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
    this.clearNewFiles();
    this.removedIds.set([]);
    this.existingPhotos.set(item.photos ?? []);
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

  protected saveAs(isActive: boolean): void {
    this.submitted.set(true);

    if (!this.isFormValid()) return;

    this.saving.set(true);

    const current = this.editing();
    const dto: CreateCommunicateDto = {
      ...this.form(),
      isActive,
    };

    const request = current ? this.api.update(current.id, dto) : this.api.create(dto);

    request.subscribe({
      next: (communicate) => this.persistPhotos(communicate.id, current !== null),
      error: (error: unknown) => {
        this.saving.set(false);
        this.handleWriteError(error);
      },
    });
  }

  protected save(): void {
    this.saveAs(true);
  }

  protected onPageChange(event: DataListPageEvent): void {
    this.page.set(event.page);
    this.pageSize.set(event.pageSize);
    this.load();
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';

    const remaining = MAX_PHOTOS - this.totalPhotos();
    if (files.length > remaining) {
      this.toast.show('error', `Limite de ${MAX_PHOTOS} fotos por comunicado atingido.`);
    }

    for (const file of files.slice(0, Math.max(0, remaining))) {
      this.newFiles.update((list) => [
        ...list,
        { file, previewUrl: URL.createObjectURL(file) },
      ]);
    }
  }

  protected removeExisting(id: string): void {
    this.removedIds.update((list) => [...list, id]);
  }

  protected removeNew(index: number): void {
    const target = this.newFiles()[index];
    if (target) URL.revokeObjectURL(target.previewUrl);
    this.newFiles.update((list) => list.filter((_, i) => i !== index));
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

  private persistPhotos(communicateId: string, wasEditing: boolean): void {
    const ops: Observable<unknown>[] = [
      ...this.removedIds().map((id) =>
        this.uploads.remove(id).pipe(catchError(() => of(null))),
      ),
      ...this.newFiles().map((item) =>
        this.uploads
          .upload(item.file, 'communicate', communicateId)
          .pipe(catchError(() => of(null))),
      ),
    ];

    const finish = () => {
      this.saving.set(false);
      this.toast.show(
        'success',
        wasEditing ? 'Comunicado atualizado com sucesso.' : 'Comunicado criado com sucesso.',
      );
      this.modalOpen.set(false);
      this.clearNewFiles();
      this.load();
    };

    if (ops.length === 0) {
      finish();
      return;
    }
    forkJoin(ops).subscribe(() => finish());
  }

  private clearNewFiles(): void {
    for (const item of this.newFiles()) URL.revokeObjectURL(item.previewUrl);
    this.newFiles.set([]);
  }

  private handleWriteError(error: unknown): void {
    const code = this.extractErrorCode(error);

    if (code === 'city_required') {
      this.toast.show(
        'error',
        'Super Admin precisa informar uma cidade. Use um admin municipal para criar comunicados.',
      );
      return;
    }

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
