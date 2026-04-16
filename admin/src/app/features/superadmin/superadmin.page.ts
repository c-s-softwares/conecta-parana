import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CrudPage } from '../../shared/utils/crud-page';
import { PageHeader } from '../../shared/components/page-header';
import { FormContainer } from '../../shared/components/form-container';
import { FormField } from '../../shared/components/form-field';
import { ApiService } from '../../core/services/api.service';
import { EntityList } from '../../shared/components/entity-list';
import { ConfirmDialog } from '../../shared/components/confirm-dialog';
import { AdministratorItem, SuperadminForm } from './superadmin.model';


const MOCK_ADMINISTRATORS: AdministratorItem[] = [
  {
    id: 1,
    name: 'Anna Sophia',
    email: 'anna.sophia@hotmail.com',
    password: '123456',
    cityId: 'maringa',
  },
  {
    id: 2,
    name: 'Nicoly Fernandes',
    email: 'nicolyuuaa@gmail.com',
    password: '123456',
    cityId: 'sarandi',
  },
  {
    id: 3,
    name: 'Patrick Melo',
    email: 'patrickmelo@gmail.com',
    password: '123456',
    cityId: 'paicandu',
  },
];

@Component({
  selector: 'app-superadmin-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageHeader,
    FormContainer,
    FormField,
    EntityList,
    ConfirmDialog,
  ],
  templateUrl: './superadmin.page.html',
})
export class SuperadminPage extends CrudPage<SuperadminForm> {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);

  protected readonly cities = signal([
    { value: 'maringa', label: 'Maringá' },
    { value: 'sarandi', label: 'Sarandi' },
    { value: 'paicandu', label: 'Paiçandu' },
    { value: 'mandaguacu', label: 'Mandaguaçu' },
  ]);
  
  readonly items = signal<AdministratorItem[]>(MOCK_ADMINISTRATORS);
  readonly deletingItem = signal<AdministratorItem | null>(null);
  readonly editingId = signal<number | null>(null);

  get isEditing(): boolean {
  return this.editingId() !== null;
}
  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    cityId: ['', Validators.required],
  });

  protected defaultFormValues(): SuperadminForm {
    return {
      name: '',
      email: '',
      password: '',
      cityId: '',
    };
  }

override openForm(): void {
  this.editingId.set(null);
  this.form.reset(this.defaultFormValues());
  super.openForm();
}

override closeForm(): void {
  this.editingId.set(null);
  this.form.reset(this.defaultFormValues());
  super.closeForm();
}
  get nameTouched(): boolean {
    return this.form.controls.name.touched;
  }

  get nameError(): string {
    const ctrl = this.form.controls.name;
    if (ctrl.hasError('required')) return 'Nome é obrigatório.';
    if (ctrl.hasError('minlength')) return 'Nome deve ter no mínimo 3 caracteres.';
    return '';
  }
  get emailTouched(): boolean {
    return this.form.controls.email.touched;
  }

  get emailError(): string {
    const ctrl = this.form.controls.email;
    if (ctrl.hasError('required')) return 'Email é obrigatório.';
    if (ctrl.hasError('email')) return 'Email inválido.';
    return '';
  }

  get passwordTouched(): boolean {
    return this.form.controls.password.touched;
  }

  get passwordError(): string {
    const ctrl = this.form.controls.password;
    if (ctrl.hasError('required')) return 'Senha é obrigatória.';
    if (ctrl.hasError('minlength')) return 'Senha deve ter no mínimo 6 caracteres.';
    return '';
  }
  get cityTouched(): boolean {
    return this.form.controls.cityId.touched;
  }

  get cityError(): string {
    const ctrl = this.form.controls.cityId;
    if (ctrl.hasError('required')) return 'Cidade é obrigatória.';
    return '';
  }
  openEditForm(item: AdministratorItem): void {
    this.editingId.set(item.id);
    this.form.patchValue({
      name: item.name,
      email: item.email,
      password: item.password,
      cityId: item.cityId,
    });
    this.view.set('form');
  }

  confirmDelete(item: AdministratorItem): void {
    this.deletingItem.set(item);
  }

  cancelDelete(): void {
    this.deletingItem.set(null);
  }

  executeDelete(): void {
    const item = this.deletingItem();

    if (!item) return;

    this.api.delete('administradores', item.id).subscribe(() => {
      this.items.update((list) =>
        list.filter((administrator) => administrator.id !== item.id),
      );
      this.deletingItem.set(null);
    });
  }
  getCityLabel(cityId: string): string {
    return this.cities().find((city) => city.value === cityId)?.label ?? cityId;
  }
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
const currentEditingId = this.editingId();

if (currentEditingId !== null) {
  const administratorId = Number(currentEditingId);

  this.api.update('administradores', administratorId, raw).subscribe(() => {
    this.items.update((list) =>
      list.map((administrator) =>
        administrator.id === administratorId
          ? { ...administrator, ...raw }
          : administrator,
      ),
    );

    this.closeForm();
  });

  return;
}

    this.api.create('administradores', raw).subscribe(() => {
      const newAdministrator: AdministratorItem = {
        id: Date.now(),
        ...raw,
      };

      this.items.update((list) => [...list, newAdministrator]);
      this.closeForm();
    });
  }
}