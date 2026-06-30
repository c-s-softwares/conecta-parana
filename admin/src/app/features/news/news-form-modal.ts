import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Observable, catchError, forkJoin, of } from 'rxjs';
import { NgIcon } from '@ng-icons/core';

import { ModalDialog } from '../../shared/components/modal-dialog/modal-dialog';
import { FormField } from '../../shared/components/form-field/form-field';
import { ToastService } from '../../core/services/toast.service';
import { UploadsApi } from '../../core/services/uploads.api';
import { NewsApi } from './news.api';
import { NewsItem, NewsPhoto } from './news.model';

const MAX_PHOTOS = 10;

interface PendingFile {
  file: File;
  previewUrl: string;
}

function externalUrlValidator(control: AbstractControl): ValidationErrors | null {
  const parent = control.parent;
  if (!parent) return null;
  const linkType = parent.get('linkType')?.value as string;
  if (linkType !== 'externo') return null;
  const val = (control.value as string | undefined)?.trim();
  if (!val) return { required: true };
  try {
    new URL(val);
    return null;
  } catch {
    return { url: true };
  }
}

@Component({
  selector: 'app-news-form-modal',
  standalone: true,
  imports: [ModalDialog, FormField, NgIcon, ReactiveFormsModule],
  templateUrl: './news-form-modal.html',
})
export class NewsFormModal {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(NewsApi);
  private readonly uploads = inject(UploadsApi);
  private readonly toast = inject(ToastService);

  readonly open = input.required<boolean>();
  readonly news = input<NewsItem | null>(null);

  readonly saved = output<void>();
  readonly closed = output<void>();

  protected readonly maxPhotos = MAX_PHOTOS;
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);

  private readonly existingPhotos = signal<NewsPhoto[]>([]);
  private readonly removedIds = signal<string[]>([]);
  protected readonly newFiles = signal<PendingFile[]>([]);

  protected readonly visiblePhotos = computed(() =>
    this.existingPhotos().filter((p) => !this.removedIds().includes(p.id)),
  );
  protected readonly totalPhotos = computed(
    () => this.visiblePhotos().length + this.newFiles().length,
  );

  private currentId: string | null = null;
  private wasOpen = false;

  protected readonly form = this.fb.group({
    title: [
      '',
      [Validators.required, Validators.minLength(5), Validators.maxLength(200)],
    ],
    description: ['', [Validators.required, Validators.minLength(10)]],
    type: ['geral', [Validators.required]],
    linkType: ['interno', [Validators.required]],
    linkUrl: ['', [externalUrlValidator]],
    isActive: [true],
  });

  constructor() {
    effect(() => {
      const isOpen = this.open();
      if (isOpen && !this.wasOpen) this.initialize();
      this.wasOpen = isOpen;
    });

    this.form.get('linkType')!.valueChanges.subscribe(() => {
      this.form.get('linkUrl')!.updateValueAndValidity();
    });
  }

  protected isEditing(): boolean {
    return this.currentId !== null;
  }

  protected isInvalid(name: string): boolean {
    const control = this.form.get(name);
    if (!control) return false;
    return control.invalid && (control.touched || this.submitted());
  }

  protected errorFor(name: string): string {
    const errors = this.form.get(name)?.errors;
    if (!errors) return '';
    switch (name) {
      case 'title':
        if (errors['required']) return 'Título é obrigatório.';
        if (errors['minlength']) return 'Título deve ter no mínimo 5 caracteres.';
        if (errors['maxlength'])
          return 'Título deve ter no máximo 200 caracteres.';
        break;
      case 'description':
        if (errors['required']) return 'Descrição é obrigatória.';
        if (errors['minlength'])
          return 'Descrição deve ter no mínimo 10 caracteres.';
        break;
      case 'type':
        if (errors['required']) return 'Selecione o tipo.';
        if (errors['serverType']) return 'Tipo de notícia inválido.';
        break;
      case 'linkType':
        if (errors['required']) return 'Selecione o tipo de link.';
        if (errors['serverLinkType']) return 'Tipo de link inválido.';
        break;
      case 'linkUrl':
        if (errors['required']) return 'URL é obrigatória para notícias externas.';
        if (errors['url']) return 'Informe uma URL válida (ex: https://exemplo.com).';
        break;
    }
    return 'Campo inválido.';
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';

    const remaining = MAX_PHOTOS - this.totalPhotos();
    if (files.length > remaining) {
      this.toast.show(
        'error',
        `Limite de ${MAX_PHOTOS} fotos por notícia atingido.`,
      );
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

  protected onSubmit(): void {
    this.submitted.set(true);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = this.form.getRawValue();
    const payload: Record<string, unknown> = {
      title: value.title!,
      description: value.description!,
      type: value.type!,
      linkType: value.linkType!,
      isActive: value.isActive!,
    };

    if (value.linkType === 'externo') {
      payload['linkUrl'] = value.linkUrl;
    }

    this.saving.set(true);
    const editingId = this.currentId;
    const request$ = editingId
      ? this.api.update(editingId, payload)
      : this.api.create(payload);

    request$.subscribe({
      next: (item) => this.persistPhotos(item.id, editingId !== null),
      error: (err: unknown) => {
        this.saving.set(false);
        this.handleSaveError(err);
      },
    });
  }

  protected onCancel(): void {
    this.closed.emit();
  }

  private persistPhotos(newsId: string, wasEditing: boolean): void {
    const ops: Observable<unknown>[] = [
      ...this.removedIds().map((id) =>
        this.uploads.remove(id).pipe(catchError(() => of(null))),
      ),
      ...this.newFiles().map((item) =>
        this.uploads
          .upload(item.file, 'news', newsId)
          .pipe(catchError(() => of(null))),
      ),
    ];

    const finish = () => {
      this.saving.set(false);
      this.toast.show(
        'success',
        wasEditing ? 'Notícia atualizada.' : 'Notícia criada.',
      );
      this.saved.emit();
    };

    if (ops.length === 0) {
      finish();
      return;
    }
    forkJoin(ops).subscribe(() => finish());
  }

  private initialize(): void {
    this.submitted.set(false);
    this.saving.set(false);
    this.removedIds.set([]);
    this.clearNewFiles();
    const target = this.news();

    if (!target) {
      this.currentId = null;
      this.existingPhotos.set([]);
      this.form.reset({
        title: '',
        description: '',
        type: 'geral',
        linkType: 'interno',
        linkUrl: '',
        isActive: true,
      });
      return;
    }

    this.currentId = target.id;
    this.existingPhotos.set(target.photos ?? []);
    this.patchFormFrom(target);

    this.api.get(target.id).subscribe({
      next: (detail) => {
        this.existingPhotos.set(detail.photos ?? []);
        this.patchFormFrom(detail);
      },
      error: () => this.closed.emit(),
    });
  }

  private patchFormFrom(item: NewsItem): void {
    this.form.reset({
      title: item.title,
      description: item.description,
      type: item.type,
      linkType: item.linkType,
      linkUrl: item.linkUrl ?? '',
      isActive: item.isActive,
    });
  }

  private clearNewFiles(): void {
    for (const item of this.newFiles()) URL.revokeObjectURL(item.previewUrl);
    this.newFiles.set([]);
  }

  private handleSaveError(err: unknown): void {
    const code = readCode(err);
    if (code === 'invalid_type') {
      this.form.get('type')?.setErrors({ serverType: true });
      return;
    }
    if (code === 'invalid_link_type') {
      this.form.get('linkType')?.setErrors({ serverLinkType: true });
      return;
    }
    if (code === 'validation_failed') {
      const messages = readValidationMessages(err);
      for (const msg of messages) {
        if (msg.toLowerCase().includes('linkurl')) {
          this.form.get('linkUrl')?.setErrors({ url: true });
        }
      }
    }
    if (readStatus(err) === 403) {
      this.closed.emit();
    }
  }
}

function readCode(err: unknown): string | undefined {
  if (err && typeof err === 'object' && 'details' in err) {
    const details = (err as { details?: unknown }).details;
    if (details && typeof details === 'object' && 'code' in details) {
      const code = (details as { code?: unknown }).code;
      return typeof code === 'string' ? code : undefined;
    }
  }
  return undefined;
}

function readValidationMessages(err: unknown): string[] {
  if (err && typeof err === 'object' && 'details' in err) {
    const details = (err as { details?: unknown }).details;
    if (details && typeof details === 'object' && 'message' in details) {
      const msg = (details as { message?: unknown }).message;
      if (Array.isArray(msg)) {
        return msg.filter((m): m is string => typeof m === 'string');
      }
    }
  }
  return [];
}

function readStatus(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status?: unknown }).status;
    return typeof status === 'number' ? status : undefined;
  }
  return undefined;
}
