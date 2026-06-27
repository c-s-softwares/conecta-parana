import { Component, effect, inject, input, output, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { NgIcon } from '@ng-icons/core';

import { ModalDialog } from '../../shared/components/modal-dialog/modal-dialog';
import { FormField } from '../../shared/components/form-field/form-field';
import { ToastService } from '../../core/services/toast.service';
import { UploadsApi } from '../../core/services/uploads.api';
import { EventsApi } from './events.api';
import { EVENT_TYPES, EventItem, EventPhoto } from './events.model';

const MAX_PHOTOS = 10;

/** Data do evento precisa ser futura (alem da validacao do backend). */
function futureDate(control: AbstractControl): ValidationErrors | null {
  const value = control.value as string;
  if (!value) return null;
  return new Date(value).getTime() > Date.now() ? null : { pastDate: true };
}

type Tab = 'dados' | 'fotos';

@Component({
  selector: 'app-event-form-modal',
  standalone: true,
  imports: [ModalDialog, FormField, NgIcon, ReactiveFormsModule],
  templateUrl: './event-form-modal.html',
})
export class EventFormModal {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(EventsApi);
  private readonly uploads = inject(UploadsApi);
  private readonly toast = inject(ToastService);

  readonly open = input.required<boolean>();
  /** Evento a editar; null = criacao. */
  readonly event = input<EventItem | null>(null);

  readonly saved = output<void>();
  readonly closed = output<void>();

  protected readonly eventTypes = EVENT_TYPES;
  protected readonly activeTab = signal<Tab>('dados');
  protected readonly saving = signal(false);
  protected readonly photos = signal<EventPhoto[]>([]);
  protected readonly submitted = signal(false);

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

  protected setTab(tab: Tab): void {
    if (tab === 'fotos' && !this.isEditing()) return;
    this.activeTab.set(tab);
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

    this.saving.set(true);

    const request$ = this.currentId
      ? this.api.update(this.currentId, {
          ...payload,
          updatedAt: this.loadedUpdatedAt ?? undefined,
        })
      : this.api.create(payload);

    request$.subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.show(
          'success',
          this.currentId ? 'Evento atualizado.' : 'Evento criado.',
        );
        this.saved.emit();
      },
      error: (err: unknown) => {
        this.saving.set(false);
        this.handleSaveError(err);
      },
    });
  }

  protected onCancel(): void {
    this.closed.emit();
  }

  // ---- Fotos ----

  protected onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];
    input.value = '';
    if (!this.currentId) return;

    for (const file of files) {
      if (this.photos().length >= MAX_PHOTOS) {
        this.toast.show('error', `Limite de ${MAX_PHOTOS} fotos por evento atingido.`);
        break;
      }
      this.uploads.upload(file, 'event', this.currentId).subscribe({
        next: (photo) =>
          this.photos.update((list) => [
            ...list,
            { id: photo.id, url: photo.url, thumbUrl: photo.thumbUrl },
          ]),
        // Erro (file_too_large, etc.) ja gera toast no interceptor; fila segue.
        error: () => undefined,
      });
    }
  }

  protected removePhoto(id: string): void {
    this.uploads.remove(id).subscribe({
      next: () => this.photos.update((list) => list.filter((p) => p.id !== id)),
      error: () => undefined,
    });
  }

  // ---- internos ----

  private initialize(): void {
    this.submitted.set(false);
    this.saving.set(false);
    this.activeTab.set('dados');
    const target = this.event();

    if (!target) {
      this.currentId = null;
      this.loadedUpdatedAt = null;
      this.photos.set([]);
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
    this.api.get(target.id).subscribe({
      next: (detail) => {
        this.loadedUpdatedAt = detail.updatedAt;
        this.photos.set(detail.photos);
        this.form.reset({
          title: detail.title,
          description: detail.description,
          type: detail.type,
          isActive: detail.isActive,
          eventDate: toLocalInput(detail.eventDate),
        });
      },
      error: () => this.closed.emit(),
    });
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
      // city_scope_denied: toast vem do interceptor; fecha o modal.
      this.closed.emit();
    }
    // event_changed (409) e demais: toast do interceptor, modal permanece aberto.
  }
}

const REQUIRED_MESSAGES: Record<string, string> = {
  title: 'Informe o título.',
  description: 'Informe a descrição.',
  type: 'Selecione o tipo.',
  eventDate: 'Informe a data e hora.',
};

/** ISO 8601 -> valor de `datetime-local` (yyyy-MM-ddTHH:mm) no fuso local. */
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
