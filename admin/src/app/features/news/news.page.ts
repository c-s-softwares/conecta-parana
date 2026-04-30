import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CrudPage } from '../../shared/utils/crud-page';
import { PageHeader } from '../../shared/components/page-header';
import { FormContainer } from '../../shared/components/form-container';
import { FormField } from '../../shared/components/form-field';
import { EntityList } from '../../shared/components/entity-list';
import { ConfirmDialog } from '../../shared/components/confirm-dialog';
import { ApiService } from '../../core/services/api.service';
import { noSpecialChars } from '../../shared/validators/no-special-chars.validator';
import { generateSlug } from '../../shared/utils/slug';
import { NewsForm, NewsItem } from './news.model';

const MOCK_NEWS: NewsItem[] = [
  {
    id: 1,
    title: 'Nova linha de ônibus interurbano conecta Maringá e Londrina',
    description: 'A partir de maio, uma nova linha de transporte coletivo vai ligar as duas maiores cidades do norte do Paraná com horários ampliados.',
    linkType: 'external',
    linkUrl: 'https://exemplo.com/onibus-interurbano',
    isActive: true,
  },
  {
    id: 2,
    title: 'Programa de vacinação ampliado para toda a região metropolitana',
    description: 'Secretaria de Saúde anuncia ampliação da campanha de vacinação com novos postos em 12 municípios da região metropolitana de Curitiba.',
    linkType: 'internal',
    linkUrl: '/programa-de-vacinacao-ampliado-para-toda-a-regiao-metropolitana',
    isActive: true,
  },
  {
    id: 3,
    title: 'Festival cultural de inverno cancelado por questões orçamentárias',
    description: 'O festival que aconteceria em julho foi cancelado. A prefeitura informou que os recursos serão redirecionados para obras de infraestrutura.',
    linkType: 'external',
    linkUrl: 'https://exemplo.com/festival-cancelado',
    isActive: false,
  },
];

@Component({
  selector: 'app-news-page',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeader, FormContainer, FormField, EntityList, ConfirmDialog],
  templateUrl: './news.page.html',
})
export class NewsPage extends CrudPage<NewsForm> {
  private readonly fb = inject(FormBuilder);
  private readonly api = inject(ApiService);

  protected readonly linkType = signal<'external' | 'internal'>('external');
  readonly items = signal<NewsItem[]>(MOCK_NEWS);
  readonly deletingItem = signal<NewsItem | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, noSpecialChars()]],
    description: ['', Validators.required],
    linkType: ['external' as 'internal' | 'external'],
    linkUrl: [''],
    isActive: [true],
  });

  protected defaultFormValues(): NewsForm {
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

  openEditForm(item: NewsItem): void {
    this.editingId.set(item.id);
    this.form.patchValue(item);
    this.linkType.set(item.linkType);
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
    this.items.update((list) => list.filter((n) => n.id !== item.id));
    this.deletingItem.set(null);
  }

  get titleTouched(): boolean {
    return this.form.controls.title.touched;
  }

  get titleError(): string {
    const ctrl = this.form.controls.title;
    if (ctrl.hasError('required')) return 'Título é obrigatório.';
    if (ctrl.hasError('specialChars'))
      return 'Título não pode conter caracteres especiais.';
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

  get linkUrlTouched(): boolean {
    return this.form.controls.linkUrl.touched;
  }

  get urlError(): string {
    const ctrl = this.form.controls.linkUrl;
    if (ctrl.hasError('required')) return 'Url é obrigatória.';
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

    const id = this.editingId();
    if (id) {
      this.items.update((list) =>
        list.map((n) => (n.id === id ? { ...n, ...raw } : n))
      );
    } else {
      this.api.create('news', raw).subscribe(() => {
        this.view.set('list');
      })
      const newItem: NewsItem = { ...raw, id: Date.now() };
      this.items.update((list) => [...list, newItem]);
    }

    this.editingId.set(null);
    this.view.set('list');
  }

  protected generateSlugPreview(title: string): string {
    return generateSlug(title);
  }
}
