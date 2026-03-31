import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrudPage } from '../../shared/utils/crud-page';
import { PageHeader } from '../../shared/components/page-header';
import { FormContainer } from '../../shared/components/form-container';
import { FormField } from '../../shared/components/form-field';
import { ApiService } from '../../core/services/api.service';
import { noSpecialChars } from '../../shared/validators/no-special-chars.validator';

interface PostFormValues {
  title: string;
  description: string;
  category: string;
}

@Component({
  selector: 'app-posts-page',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeader, FormContainer, FormField],
  templateUrl: './posts.page.html',
})
export class PostsPage extends CrudPage<PostFormValues> {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);

  readonly categories = [
    { value: 'evento', label: 'Evento' },
    { value: 'noticia', label: 'Notícia' },
    { value: 'comunicado', label: 'Comunicado' },
  ] as const;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, noSpecialChars()]],
    description: ['', [Validators.required]],
    category: ['', [Validators.required]],
  });

  protected defaultFormValues(): PostFormValues {
    return {
      title: '',
      description: '',
      category: '',
    };
  }

  get titleTouched(): boolean {
    return this.form.controls.title.touched;
  }

  get titleError(): string {
    const ctrl = this.form.controls.title;

    if (ctrl.hasError('required')) return 'Título é obrigatório.';
    if (ctrl.hasError('specialChars')) return 'Título não pode conter caracteres especiais.';

    return '';
  }

  get descriptionTouched(): boolean {
    return this.form.controls.description.touched;
  }

  get descriptionError(): string {
    const ctrl = this.form.controls.description;

    if (ctrl.hasError('required')) return 'Descrição é obrigatória.';

    return '';
  }

  get categoryTouched(): boolean {
    return this.form.controls.category.touched;
  }

  get categoryError(): string {
    const ctrl = this.form.controls.category;

    if (ctrl.hasError('required')) return 'Categoria é obrigatória.';

    return '';
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    this.api.create('posts', raw).subscribe(() => {
      this.view.set('list');
    });
  }
}