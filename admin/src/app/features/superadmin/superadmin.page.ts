import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CrudPage } from '../../shared/utils/crud-page';
import { PageHeader } from '../../shared/components/page-header';
import { FormContainer } from '../../shared/components/form-container';
import { FormField } from '../../shared/components/form-field';
import { ApiService } from '../../core/services/api.service';
import { SuperadminForm } from './superadmin.model';

@Component({
  selector: 'app-superadmin-page',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeader, FormContainer, FormField],
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
  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    // TODO: esta tela deve ficar disponível apenas para admin geral / superadmin.
    this.api.create('superadmin', raw).subscribe(() => {
      this.view.set('list');
    });
  }
}