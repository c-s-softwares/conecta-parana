import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { CrudPage } from '../../shared/utils/crud-page';
import { PageHeader } from '../../shared/components/page-header';
import { FormContainer } from '../../shared/components/form-container';
import { FormField } from '../../shared/components/form-field';
import { ApiService } from '../../core/services/api.service';

function futureDateValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const date = new Date(control.value);
  return date > new Date() ? null : { pastDate: true };
}

interface EventsFormValues {
  title: string;
  type: string;
  description: string;
  event_date: string;
  category_id: string;
  latitude: number | null;
  longitude: number | null;
  local_id: string;
}

@Component({
  selector: 'app-events-page',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeader, FormContainer, FormField],
  templateUrl: './events.page.html',
})
export class EventsPage extends CrudPage<EventsFormValues> {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);

  protected readonly photos = signal<File[]>([]);
  protected readonly photoErrors = signal<string[]>([]);

  readonly eventTypes = [
    { value: 'cultural', label: 'Cultural' },
    { value: 'esportivo', label: 'Esportivo' },
    { value: 'saude', label: 'Saúde' },
    { value: 'educacao', label: 'Educação' },
    { value: 'tecnologia', label: 'Tecnologia' },
    { value: 'lazer', label: 'Lazer' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    type: ['', Validators.required],
    description: ['', [Validators.required, Validators.minLength(10)]],
    event_date: ['', futureDateValidator],
    category_id: [''],
    latitude: [null as number | null, [Validators.min(-90), Validators.max(90)]],
    longitude: [null as number | null, [Validators.min(-180), Validators.max(180)]],
    local_id: [''],
  });

  protected defaultFormValues(): EventsFormValues {
    return {
      title: '',
      type: '',
      description: '',
      event_date: '',
      category_id: '',
      latitude: null,
      longitude: null,
      local_id: '',
    };
  }

  override openForm(): void {
    super.openForm();
    this.photos.set([]);
    this.photoErrors.set([]);
  }

  get titleTouched(): boolean { return this.form.controls.title.touched; }
  get titleError(): string {
    const ctrl = this.form.controls.title;
    if (ctrl.hasError('required')) return 'Título é obrigatório.';
    if (ctrl.hasError('minlength')) return 'Título deve ter no mínimo 3 caracteres.';
    if (ctrl.hasError('maxlength')) return 'Título deve ter no máximo 200 caracteres.';
    return '';
  }

  get typeTouched(): boolean { return this.form.controls.type.touched; }
  get typeError(): string {
    const ctrl = this.form.controls.type;
    if (ctrl.hasError('required')) return 'Tipo é obrigatório.';
    return '';
  }

  get descriptionTouched(): boolean { return this.form.controls.description.touched; }
  get descriptionError(): string {
    const ctrl = this.form.controls.description;
    if (ctrl.hasError('required')) return 'Descrição é obrigatória.';
    if (ctrl.hasError('minlength')) return 'Descrição deve ter no mínimo 10 caracteres.';
    return '';
  }

  get eventDateTouched(): boolean { return this.form.controls.event_date.touched; }
  get eventDateError(): string {
    const ctrl = this.form.controls.event_date;
    if (ctrl.hasError('pastDate')) return 'A data do evento deve ser futura.';
    return '';
  }

  get latitudeTouched(): boolean { return this.form.controls.latitude.touched; }
  get latitudeError(): string {
    const ctrl = this.form.controls.latitude;
    if (ctrl.hasError('min') || ctrl.hasError('max')) return 'Latitude deve estar entre -90 e 90.';
    return '';
  }

  get longitudeTouched(): boolean { return this.form.controls.longitude.touched; }
  get longitudeError(): string {
    const ctrl = this.form.controls.longitude;
    if (ctrl.hasError('min') || ctrl.hasError('max')) return 'Longitude deve estar entre -180 e 180.';
    return '';
  }

  onPhotosSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(Array.from(input.files));
    }
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.processFiles(Array.from(event.dataTransfer.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  private processFiles(files: File[]): void {
    const errors: string[] = [];
    const valid: File[] = [];
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024;

    for (const file of files) {
      if (!allowed.includes(file.type)) {
        errors.push(`${file.name}: formato inválido (use jpg, png ou webp).`);
        continue;
      }
      if (file.size > maxSize) {
        errors.push(`${file.name}: tamanho máximo é 5MB.`);
        continue;
      }
      valid.push(file);
    }

    this.photos.update(prev => [...prev, ...valid]);
    this.photoErrors.set(errors);
  }

  removePhoto(index: number): void {
    this.photos.update(prev => prev.filter((_, i) => i !== index));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.api.create('events', { ...raw, photos: this.photos() }).subscribe(() => {
      this.view.set('list');
    });
  }
}
