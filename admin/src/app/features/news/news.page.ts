import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CrudPage } from '../../shared/utils/crud-page';
import { PageHeader } from '../../shared/components/page-header';
import { FormContainer } from '../../shared/components/form-container';
import { FormField } from '../../shared/components/form-field';
import { ApiService } from '../../core/services/api.service';
import { noSpecialChars } from '../../shared/validators/no-special-chars.validator';
import { generateSlug } from '../../shared/utils/slug';

interface NewsFormValues {
  title: string;
  description: string;
  linkType: 'internal' | 'external';
  linkUrl: string;
  isActive: boolean;
}

@Component({
  selector: 'app-news-page',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeader, FormContainer, FormField],
  templateUrl: './news.page.html',
})
export class NewsPage extends CrudPage<NewsFormValues> {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);

  protected readonly linkType = signal<'external' | 'internal'>('external');

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, noSpecialChars()]],
    description: ['', Validators.required],
    linkType: ['external' as 'internal' | 'external'],
    linkUrl: [''],
    isActive: [true],
  });

  protected defaultFormValues(): NewsFormValues {
    return {
      title: '',
      description: '',
      linkType: 'external',
      linkUrl: '',
      isActive: true,
    };
  }

  override openForm(): void {
    super.openForm();
    this.linkType.set('external');
  }

  // TODO: generalizar para função getError reutilizável
  get titleError(): string {
    const ctrl = this.form.controls.title;
    if (ctrl.hasError('required')) return 'Título é obrigatório.';
    if (ctrl.hasError('specialChars'))
      return 'Título não pode conter caracteres especiais.';
    return '';
  }

  get urlError(): string {
    const ctrl = this.form.controls.linkUrl;
    if (ctrl.hasError('required')) return 'Url é obrigatória.';
    console.log(ctrl.errors)
    if (ctrl.hasError('pattern'))
      return 'Url da notícia inválida: necessário começar com "https://"';
    return '';
  }

  onLinkTypeChange(): void {
    const type = this.form.controls.linkType.value;
    this.linkType.set(type);
    this.form.controls.linkUrl.reset();
  }

  onSubmit(): void {
    if (this.linkType() === 'external') {
      this.form.controls.linkUrl.setValidators([Validators.required, Validators.pattern(/^https:\/\//)]);
      this.form.controls.linkUrl.updateValueAndValidity();
    } else {
      this.form.controls.linkUrl.clearValidators();
      this.form.controls.linkUrl.updateValueAndValidity();
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    if (raw.linkType === 'internal') {
      raw.linkUrl = generateSlug(raw.title);
    }

    this.api.create('news', raw).subscribe(() => {
      this.view.set('list');
    });
  }

  protected generateSlugPreview(title: string): string {
    return generateSlug(title);
  }
}
