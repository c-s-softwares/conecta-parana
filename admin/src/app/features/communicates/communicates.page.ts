import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrudPage } from '../../shared/utils/crud-page';
import { PageHeader } from '../../shared/components/page-header';
import { FormContainer } from '../../shared/components/form-container';
import { FormField } from '../../shared/components/form-field';
import { noSpecialChars } from '../../shared/validators/no-special-chars.validator';
import { Communicate, CommunicateForm } from './communicates.model';

interface CommunicateFormValues {
  title: string;
  description: string;
  category: CommunicateForm['category'] | '';
}

const MOCK_COMMUNICATES: Communicate[] = [
  {
    id: 1,
    title: 'Feira cultural na praça central',
    description:
      'Evento com música, gastronomia e atrações para toda a família no centro da cidade.',
    category: 'evento',
  },
  {
    id: 2,
    title: 'Nova unidade de saúde será inaugurada',
    description:
      'A prefeitura anunciou a inauguração de uma nova unidade de saúde para ampliar o atendimento.',
    category: 'noticia',
  },
  {
    id: 3,
    title: 'Mudança no horário de atendimento',
    description:
      'Atenção: alguns serviços públicos terão novo horário de funcionamento a partir da próxima semana.',
    category: 'comunicado',
  },
];

/**
 * @deprecated Não é mais roteado. Substituído por placeholder
 * enquanto o design não é implementado. 
 * 
 * Mantido apenas como referência de lógica
 */
@Component({
  selector: 'app-communicates-page',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeader, FormContainer, FormField],
  templateUrl: './communicates.page.html',
})
export class CommunicatesPage extends CrudPage<CommunicateFormValues> {
  private readonly fb = inject(FormBuilder);

  readonly communicates = signal<Communicate[]>(MOCK_COMMUNICATES);

  readonly categories = [
    { value: 'evento', label: 'Evento' },
    { value: 'noticia', label: 'Notícia' },
    { value: 'comunicado', label: 'Comunicado' },
  ] as const;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, noSpecialChars()]],
    description: ['', [Validators.required]],
    category: ['' as CommunicateForm['category'] | '', [Validators.required]],
  });

  protected defaultFormValues(): CommunicateFormValues {
    return {
      title: '',
      description: '',
      category: '',
    };
  }

  override openForm(): void {
    this.editingId.set(null);
    this.form.reset({
      title: '',
      description: '',
      category: '',
    });
    super.openForm();
  }

  override closeForm(): void {
    this.editingId.set(null);
    this.form.reset({
      title: '',
      description: '',
      category: '',
    });
    super.closeForm();
  }

  get formTitle(): string {
    return this.editingId() === null ? 'CRIAR COMUNICADO' : 'EDITAR COMUNICADO';
  }

  get submitButtonLabel(): string {
    return this.editingId() === null ? 'Criar' : 'Atualizar';
  }

  get titleTouched(): boolean {
    return this.form.controls.title.touched;
  }

  get titleError(): string {
    const ctrl = this.form.controls.title;

    if (ctrl.hasError('required')) return 'Título é obrigatório.';
    if (ctrl.hasError('specialChars')) {
      return 'Título não pode conter caracteres especiais.';
    }

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

  onEdit(communicate: Communicate): void {
    this.editingId.set(communicate.id);

    this.form.reset({
      title: communicate.title,
      description: communicate.description,
      category: communicate.category,
    });

    this.view.set('form');
  }

  onDelete(id: number): void {
    const confirmed = window.confirm('Deseja realmente excluir este comunicado?');

    if (!confirmed) {
      return;
    }

    this.communicates.update((list) => list.filter((communicate) => communicate.id !== id));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const currentEditingId = this.editingId();

    if (currentEditingId !== null) {
      this.communicates.update((list) =>
        list.map((communicate) =>
          communicate.id === currentEditingId
            ? {
                ...communicate,
                title: raw.title,
                description: raw.description,
                category: raw.category as CommunicateForm['category'],
              }
            : communicate,
        ),
      );
    } else {
      const newCommunicate: Communicate = {
        id: Date.now(),
        title: raw.title,
        description: raw.description,
        category: raw.category as CommunicateForm['category'],
      };

      this.communicates.update((list) => [...list, newCommunicate]);
    }

    this.closeForm();
  }
}
