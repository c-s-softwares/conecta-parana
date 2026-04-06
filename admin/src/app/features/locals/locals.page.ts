import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CrudPage } from '../../shared/utils/crud-page';
import { PageHeader } from '../../shared/components/page-header';
import { FormContainer } from '../../shared/components/form-container';
import { FormField } from '../../shared/components/form-field';

interface LocalFormValues {
  name: string;
  phone: string;
  description: string;
  latitude: string;
  longitude: string;
  category: string;
  photos: FileList | null;
}

interface Local extends LocalFormValues {
  id: string;
}

@Component({
  selector: 'app-locals-page',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeader, FormContainer, FormField],
  templateUrl: './locals.page.html',
})
export class LocalsPage extends CrudPage<LocalFormValues> {
  private readonly fb = inject(FormBuilder);

  protected readonly categories = [
    'Restaurante', 'Hotel', 'Ponto Turístico', 'Parque',
    'Shopping', 'Hospital', 'Escola', 'Igreja', 'Museu', 'Outro',
  ];

  // ID do local sendo editado (null = criação)
  protected editingId = signal<string | null>(null);

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
    return { name: '', phone: '', description: '', latitude: '', longitude: '', category: '', photos: null };
  }

  // --- Lista ---
  protected getLocals(): Local[] {
    return JSON.parse(localStorage.getItem('locais') ?? '[]');
  }

  // --- Abrir formulário de edição ---
  protected openEdit(local: Local): void {
    this.editingId.set(local.id);

    // Photos não é serializável, então remove o required ao editar
    this.form.controls.photos.clearValidators();
    this.form.controls.photos.updateValueAndValidity();

    this.form.patchValue({
      name:        local.name,
      phone:       local.phone,
      description: local.description,
      latitude:    local.latitude,
      longitude:   local.longitude,
      category:    local.category,
    });

    this.view.set('form');
  }

  // --- Fechar formulário (override para limpar estado de edição) ---
  override closeForm(): void {
    this.editingId.set(null);
    this.restorePhotosValidator();
    super.closeForm();
  }

  // --- Deletar ---
  protected deleteLocal(id: string): void {
    if (!confirm('Tem certeza que deseja excluir este local?')) return;
    const updated = this.getLocals().filter(l => l.id !== id);
    localStorage.setItem('locais', JSON.stringify(updated));
  }

  // --- Submit (criar ou editar) ---
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const toSave = { ...raw, photos: null };
    const existing = this.getLocals();
    const id = this.editingId();

    if (id) {
      // Edição
      const index = existing.findIndex(l => l.id === id);
      if (index !== -1) existing[index] = { ...existing[index], ...toSave };
    } else {
      // Criação
      existing.push({ ...toSave, id: crypto.randomUUID() });
    }

    localStorage.setItem('locais', JSON.stringify(existing));
    this.editingId.set(null);
    this.restorePhotosValidator();
    this.view.set('list');
  }

  private restorePhotosValidator(): void {
    this.form.controls.photos.setValidators(Validators.required);
    this.form.controls.photos.updateValueAndValidity();
  }

  // --- Touched ---
  get nameTouched()      { return this.form.controls.name.touched; }
  get latitudeTouched()  { return this.form.controls.latitude.touched; }
  get longitudeTouched() { return this.form.controls.longitude.touched; }
  get categoryTouched()  { return this.form.controls.category.touched; }
  get photosTouched()    { return this.form.controls.photos.touched; }

  // --- Errors ---
  get nameError():      string { return this.form.controls.name.hasError('required')      ? 'Nome é obrigatório.'        : ''; }
  get latitudeError():  string { return this.form.controls.latitude.hasError('required')  ? 'Latitude é obrigatória.'    : ''; }
  get longitudeError(): string { return this.form.controls.longitude.hasError('required') ? 'Longitude é obrigatória.'   : ''; }
  get categoryError():  string { return this.form.controls.category.hasError('required')  ? 'Categoria é obrigatória.'   : ''; }
  get photosError():    string { return this.form.controls.photos.hasError('required')    ? 'Adicione ao menos uma foto.' : ''; }

  onPhotosChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) this.form.controls.photos.setValue(input.files);
  }
}