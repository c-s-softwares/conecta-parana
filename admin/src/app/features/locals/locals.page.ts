import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CrudPage } from '../../shared/utils/crud-page';
import { PageHeader } from '../../shared/components/page-header';
import { FormContainer } from '../../shared/components/form-container';
import { FormField } from '../../shared/components/form-field';
import { ApiService } from '../../core/services/api.service';

interface LocalFormValues {
  name: string;
  phone: string;
  description: string;
  latitude: string;
  longitude: string;
  category: string;
  photos: FileList | null;
}

@Component({
  selector: 'app-locals-page',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeader, FormContainer, FormField],
  templateUrl: './locals.page.html',
})
export class LocalsPage extends CrudPage<LocalFormValues> {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);

  protected readonly form = this.fb.nonNullable.group({
    name:        ['', Validators.required],
    phone:       [''],
    description: [''],
    latitude:    ['', Validators.required],
    longitude:   ['', Validators.required],
    category:    ['', Validators.required],
    photos:      [null as FileList | null, Validators.required],
  });

  protected defaultFormValues(): LocalFormValues {
    return {
      name: '',
      phone: '',
      description: '',
      latitude: '',
      longitude: '',
      category: '',
      photos: null,
    };
  }

  // --- Touched ---

  get nameTouched(): boolean      { return this.form.controls.name.touched; }
  get latitudeTouched(): boolean  { return this.form.controls.latitude.touched; }
  get longitudeTouched(): boolean { return this.form.controls.longitude.touched; }
  get categoryTouched(): boolean  { return this.form.controls.category.touched; }
  get photosTouched(): boolean    { return this.form.controls.photos.touched; }

  // --- Errors ---

  get nameError(): string {
    const ctrl = this.form.controls.name;
    if (ctrl.hasError('required')) return 'Nome é obrigatório.';
    return '';
  }

  get latitudeError(): string {
    const ctrl = this.form.controls.latitude;
    if (ctrl.hasError('required')) return 'Latitude é obrigatória.';
    return '';
  }

  get longitudeError(): string {
    const ctrl = this.form.controls.longitude;
    if (ctrl.hasError('required')) return 'Longitude é obrigatória.';
    return '';
  }

  get categoryError(): string {
    const ctrl = this.form.controls.category;
    if (ctrl.hasError('required')) return 'Categoria é obrigatória.';
    return '';
  }

  get photosError(): string {
    const ctrl = this.form.controls.photos;
    if (ctrl.hasError('required')) return 'Adicione ao menos uma foto.';
    return '';
  }

  // --- Ações ---

  onPhotosChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.form.controls.photos.setValue(input.files);
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.api.create('locals', this.form.getRawValue()).subscribe(() => {
      this.view.set('list');
    });
  }
}