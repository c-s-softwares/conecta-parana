import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CrudPage } from '../../shared/utils/crud-page';
import { PageHeader } from '../../shared/components/page-header';
import { FormContainer } from '../../shared/components/form-container';
import { FormField } from '../../shared/components/form-field';

interface NotificationFormValues {
  title: string;
  description: string;
  type: string;
}

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeader, FormContainer, FormField],
  templateUrl: 'notification.page.html',
})
export class NotificationComponent extends CrudPage<NotificationFormValues> {
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    type: ['', Validators.required],
  });

  protected defaultFormValues(): NotificationFormValues {
    return { title: '', description: '', type: '' };
  }

  get titleTouched(): boolean { return this.form.controls.title.touched; }

  get titleError(): string {
    const ctrl = this.form.controls.title;
    if (ctrl.hasError('required')) return 'Título é obrigatório.';
    if (ctrl.hasError('minlength')) return 'Título deve ter no mínimo 3 caracteres.';
    if (ctrl.hasError('maxlength')) return 'Título deve ter no máximo 200 caracteres.';
    return '';
  }

  get descriptionTouched(): boolean { return this.form.controls.description.touched; }

  get descriptionError(): string {
    const ctrl = this.form.controls.description;
    if (ctrl.hasError('required')) return 'Descrição é obrigatória.';
    if (ctrl.hasError('minlength')) return 'Descrição deve ter no mínimo 10 caracteres.';
    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = { ...this.form.getRawValue(), city_id: 123 };
    console.log('Enviando para API:', payload);
    this.view.set('list');
  }
}