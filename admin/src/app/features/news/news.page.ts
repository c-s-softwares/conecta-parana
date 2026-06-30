import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { merge } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { CrudPage } from '../../shared/utils/crud-page';
import { PageHeader } from '../../shared/components/page-header/page-header';
import { FormContainer } from '../../shared/components/form-container/form-container';
import { FormField } from '../../shared/components/form-field/form-field';
import { EntityList } from '../../shared/components/entity-list/entity-list';
import { ConfirmDialog } from '../../shared/components/confirm-dialog/confirm-dialog';
import { NewsApi } from './news.api';
import { ToastService } from '../../core/services/toast.service';
import { AppError } from '../../core/interceptors/app-error';
import { NewsForm, NewsItem } from './news.model';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-news-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    PageHeader,
    FormContainer,
    FormField,
    EntityList,
    ConfirmDialog,
    UpperCasePipe,
  ],
  templateUrl: './news.page.html',
})
export class NewsPage extends CrudPage<NewsForm> implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly newsApi = inject(NewsApi);
  private readonly toast = inject(ToastService);

  readonly items = signal<NewsItem[]>([]);
  readonly deletingItem = signal<NewsItem | null>(null);

  //
  protected readonly searchControl = new FormControl('');
  protected readonly typeFilterControl = new FormControl('');
  protected readonly statusFilterControl = new FormControl('');

  protected typeError = '';
  protected linkTypeError = '';

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    type: ['' as NewsForm['type'], Validators.required],
    linkType: ['interno' as NewsForm['linkType'], Validators.required],
    externalUrl: [''],
    isActive: [true],
  });

  ngOnInit(): void {
    this.loadNews();

    merge(
      this.searchControl.valueChanges.pipe(debounceTime(300), distinctUntilChanged()),
      this.typeFilterControl.valueChanges,
      this.statusFilterControl.valueChanges
    ).subscribe(() => {
      this.loadNews();
    });
  }

  loadNews(): void {
    const filters = {
      type: this.typeFilterControl.value || undefined,
      isActive: this.statusFilterControl.value === 'true' ? true : this.statusFilterControl.value === 'false' ? false : undefined,
    };

    this.newsApi.list({
      search: this.searchControl.value || undefined,
      filters,
    }).subscribe({
      next: (res) => {
        this.items.set(res.items);
      },
      error: () => {
        this.toast.show('error', 'Erro ao carregar notícias.');
      },
    });
  }

  protected defaultFormValues(): NewsForm {
    return {
      title: '',
      description: '',
      type: 'geral',
      linkType: 'interno',
      externalUrl: '',
      isActive: true,
    };
  }

  override openForm(): void {
    this.typeError = '';
    this.linkTypeError = '';
    super.openForm();
  }

  openEditForm(item: NewsItem): void {
    this.typeError = '';
    this.linkTypeError = '';
    this.editingId.set(item.id);
    this.form.patchValue({
      title: item.title,
      description: item.description,
      type: item.type,
      linkType: item.linkType,
      externalUrl: '',
      isActive: item.isActive,
    });
    this.view.set('form');
  }

  confirmDelete(item: NewsItem): void {
    this.deletingItem.set(item);
  }

  cancelDelete(): void {
    this.deletingItem.set(null);
  }

  executeDelete(): void {
    const item = this.deletingItem();
    if (!item) return;

    this.newsApi.delete(item.id).subscribe({
      next: () => {
        this.toast.show('success', 'Notícia excluída com sucesso.');
        this.loadNews();
        this.deletingItem.set(null);
      },
      error: (err: AppError) => {
        this.deletingItem.set(null);
        if (err.status === 404) {
          this.toast.show('error', 'Notícia não encontrada. Pode ter sido excluída por outro admin.');
          this.loadNews();
        }
      },
    });
  }

  get titleTouched(): boolean {
    return this.form.controls.title.touched;
  }

  get titleError(): string {
    const ctrl = this.form.controls.title;
    if (ctrl.hasError('required')) return 'Título é obrigatório.';
    if (ctrl.hasError('minlength')) return 'Título deve ter no mínimo 5 caracteres.';
    if (ctrl.hasError('maxlength')) return 'Título deve ter no máximo 200 caracteres.';
    if (ctrl.hasError('backend')) return ctrl.getError('backend');
    return '';
  }

  get descriptionTouched(): boolean {
    return this.form.controls.description.touched;
  }

  get descriptionError(): string {
    const ctrl = this.form.controls.description;
    if (ctrl.hasError('required')) return 'Descrição é obrigatória.';
    if (ctrl.hasError('minlength')) return 'Descrição deve ter no mínimo 10 caracteres.';
    if (ctrl.hasError('backend')) return ctrl.getError('backend');
    return '';
  }

  get typeTouched(): boolean {
    return this.form.controls.type.touched;
  }

  get linkTypeTouched(): boolean {
    return this.form.controls.linkType.touched;
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.typeError = '';
    this.linkTypeError = '';

    const raw = this.form.getRawValue();
    const dto = {
      title: raw.title,
      description: raw.description,
      type: raw.type,
      linkType: raw.linkType,
      isActive: raw.isActive,
    };

    const id = this.editingId() as string;
    const request$ = id
      ? this.newsApi.update(id, dto)
      : this.newsApi.create(dto);

    request$.subscribe({
      next: () => {
        this.toast.show('success', id ? 'Notícia atualizada com sucesso.' : 'Notícia criada com sucesso.');
        this.loadNews();
        this.closeForm();
      },
      error: (err: AppError) => {
        if (err.status === 400) {
          const details = err.details as { code?: string; message?: string[] } | null | undefined;
          const code = details?.code;
          if (code === 'invalid_type') {
            this.typeError = 'Tipo de notícia inválido.';
            this.form.controls.type.setErrors({ invalid: true });
          } else if (code === 'invalid_link_type') {
            this.linkTypeError = 'Tipo de link inválido.';
            this.form.controls.linkType.setErrors({ invalid: true });
          } else if (code === 'validation_failed') {
            const messages = details?.message || [];
            messages.forEach((msg: string) => {
              if (msg.includes('title')) {
                this.form.controls.title.setErrors({ backend: msg });
              } else if (msg.includes('description')) {
                this.form.controls.description.setErrors({ backend: msg });
              } else if (msg.includes('type')) {
                this.typeError = 'Tipo de notícia inválido.';
                this.form.controls.type.setErrors({ backend: msg });
              } else if (msg.includes('linkType')) {
                this.linkTypeError = 'Tipo de link inválido.';
                this.form.controls.linkType.setErrors({ backend: msg });
              }
            });
          }
        } else if (err.status === 404) {
          this.toast.show('error', 'Notícia não encontrada. Pode ter sido excluída por outro admin.');
          this.loadNews();
          this.closeForm();
        } else if (err.status === 403) {
          this.loadNews();
          this.closeForm();
        }
      },
    });
  }
}
