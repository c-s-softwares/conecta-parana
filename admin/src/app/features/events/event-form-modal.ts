import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { NgIcon } from '@ng-icons/core';
import { Observable, catchError, forkJoin, of } from 'rxjs';

import { ModalDialog } from '../../shared/components/modal-dialog/modal-dialog';
import { FormField } from '../../shared/components/form-field/form-field';
import { DateTimePicker } from '../../shared/components/date-time-picker/date-time-picker';
import { ToastService } from '../../core/services/toast.service';
import { UploadsApi } from '../../core/services/uploads.api';
import { EventsApi } from './events.api';
import { EVENT_TYPES, EventItem, EventPhoto } from './events.model';

const MAX_PHOTOS = 10;

interface PendingFile {
  file: File;
  previewUrl: string;
}

function futureDate(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;
  return new Date(value).getTime() > Date.now() ? null : { pastDate: true };
}

@Component({
  selector: 'app-event-form-modal',
  standalone: true,
  imports: [
    ModalDialog,
    FormField,
    DateTimePicker,
    NgIcon,
    ReactiveFormsModule,
  ],
  templateUrl: './event-form-modal.html',
})
export class EventFormModal {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(EventsApi);
  private readonly uploads = inject(UploadsApi);
  private readonly toast = inject(ToastService);

  readonly open = input.required<boolean>();
  readonly event = input<EventItem | null>(null);

  readonly saved = output<void>();
  readonly closed = output<void>();

  protected readonly eventTypes = EVENT_TYPES;
  protected readonly maxPhotos = MAX_PHOTOS;
  protected readonly saving = signal(false);
  protected readonly submitted = signal(false);

  // Fotos ja salvas no servidor (edicao), as marcadas para remover e as novas
  // selecionadas - tudo so e enviado ao salvar.
  private readonly existingPhotos = signal<EventPhoto[]>([]);
  private readonly removedIds = signal<string[]>([]);
  protected readonly newFiles = signal<PendingFile[]>([]);

  protected readonly visiblePhotos = computed(() =>
    this.existingPhotos().filter((photo) => !this.removedIds().includes(photo.id)),
  );
  protected readonly totalPhotos = computed(
    () => this.visiblePhotos().length + this.newFiles().length,
  );

  private currentId: string | null = null;
  private loadedUpdatedAt: string | null = null;
  private wasOpen = false;

  protected readonly form = this.fb.group({
    title: ['', [Validators.required]],
    description: ['', [Validators.required]],
    type: ['cultural', [Validators.required]],
    isActive: [true, []],
    eventDate: ['', [Validators.required, futureDate]],
  });

  constructor() {
    effect(() => {
      const isOpen = this.open();
      if (isOpen && !this.wasOpen) this.initialize();
      this.wasOpen = isOpen;
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
    if (errors['required']) return REQUIRED_MESSAGES[name] ?? 'Campo obrigatório.';
    if (errors['pastDate'] || errors['serverPast'])
      return 'Data do evento deve ser futura.';
    if (errors['serverType']) return 'Tipo de evento inválido.';
    return 'Campo inválido.';
  }

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';

    const remaining = MAX_PHOTOS - this.totalPhotos();
    if (files.length > remaining) {
      this.toast.show('error', `Limite de ${MAX_PHOTOS} fotos por evento atingido.`);
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
    const payload = {
      title: value.title!,
      description: value.description!,
      type: value.type!,
      isActive: value.isActive!,
      eventDate: new Date(value.eventDate!).toISOString(),
    };

    const editingId = this.currentId;
    this.saving.set(true);

    const request$ = editingId
      ? this.api.update(editingId, {
          ...payload,
          updatedAt: this.loadedUpdatedAt ?? undefined,
        })
      : this.api.create(payload);

    request$.subscribe({
      next: (event) => this.persistPhotos(event.id, editingId !== null),
      error: (err: unknown) => {
        this.saving.set(false);
        this.handleSaveError(err);
      },
    });
  }

  protected onCancel(): void {
    this.closed.emit();
  }

  // Dispara upload das novas e delete das removidas; um erro de foto nao
  // impede as demais (toast vem do interceptor).
  private persistPhotos(eventId: string, wasEditing: boolean): void {
    const ops: Observable<unknown>[] = [
      ...this.removedIds().map((id) =>
        this.uploads.remove(id).pipe(catchError(() => of(null))),
      ),
      ...this.newFiles().map((item) =>
        this.uploads
          .upload(item.file, 'event', eventId)
          .pipe(catchError(() => of(null))),
      ),
    ];

    const finish = () => {
      this.saving.set(false);
      this.toast.show(
        'success',
        wasEditing ? 'Evento atualizado.' : 'Evento criado.',
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
    const target = this.event();

    if (!target) {
      this.currentId = null;
      this.loadedUpdatedAt = null;
      this.existingPhotos.set([]);
      this.form.reset({
        title: '',
        description: '',
        type: 'cultural',
        isActive: true,
        eventDate: '',
      });
      return;
    }

    this.currentId = target.id;
    // Popula com os dados que já vêm na lista para o form não "piscar" com o
    // evento anterior; o GET abaixo só refina (updatedAt fresco + fotos).
    this.loadedUpdatedAt = target.updatedAt;
    this.existingPhotos.set(target.photos);
    this.patchFormFrom(target);

    this.api.get(target.id).subscribe({
      next: (detail) => {
        this.loadedUpdatedAt = detail.updatedAt;
        this.existingPhotos.set(detail.photos);
        this.patchFormFrom(detail);
      },
      error: () => this.closed.emit(),
    });
  }

  private patchFormFrom(item: EventItem): void {
    this.form.reset({
      title: item.title,
      description: item.description,
      type: item.type,
      isActive: item.isActive,
      eventDate: toLocalInput(item.eventDate),
    });
  }

  private clearNewFiles(): void {
    for (const item of this.newFiles()) URL.revokeObjectURL(item.previewUrl);
    this.newFiles.set([]);
  }

  private handleSaveError(err: unknown): void {
    const code = readCode(err);
    if (code === 'event_date_in_past') {
      this.form.get('eventDate')?.setErrors({ serverPast: true });
      return;
    }
    if (code === 'invalid_event_type') {
      this.form.get('type')?.setErrors({ serverType: true });
      return;
    }
    if (readStatus(err) === 403) {
      this.closed.emit();
    }
  }
}

const REQUIRED_MESSAGES: Record<string, string> = {
  title: 'Informe o título.',
  description: 'Informe a descrição.',
  type: 'Selecione o tipo.',
  eventDate: 'Informe a data e hora.',
};

function toLocalInput(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
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

function readStatus(err: unknown): number | undefined {
  if (err && typeof err === 'object' && 'status' in err) {
    const status = (err as { status?: unknown }).status;
    return typeof status === 'number' ? status : undefined;
  }
  return undefined;
}
