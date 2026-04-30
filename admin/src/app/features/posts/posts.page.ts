import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CrudPage } from '../../shared/utils/crud-page';
import { PageHeader } from '../../shared/components/page-header';
import { FormContainer } from '../../shared/components/form-container';
import { FormField } from '../../shared/components/form-field';
import { noSpecialChars } from '../../shared/validators/no-special-chars.validator';
import { Post, PostForm } from './posts.model';

interface PostFormValues {
  title: string;
  description: string;
  category: PostForm['category'] | '';
}

const MOCK_POSTS: Post[] = [
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

@Component({
  selector: 'app-posts-page',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeader, FormContainer, FormField],
  templateUrl: './posts.page.html',
})
export class PostsPage extends CrudPage<PostFormValues> {
  private readonly fb = inject(FormBuilder);

  readonly posts = signal<Post[]>(MOCK_POSTS);

  readonly categories = [
    { value: 'evento', label: 'Evento' },
    { value: 'noticia', label: 'Notícia' },
    { value: 'comunicado', label: 'Comunicado' },
  ] as const;

  readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, noSpecialChars()]],
    description: ['', [Validators.required]],
    category: ['' as PostForm['category'] | '', [Validators.required]],
  });

  protected defaultFormValues(): PostFormValues {
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
    return this.editingId() === null ? 'CRIAR POSTAGEM' : 'EDITAR POSTAGEM';
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

  onEdit(post: Post): void {
    this.editingId.set(post.id);

    this.form.reset({
      title: post.title,
      description: post.description,
      category: post.category,
    });

    this.view.set('form');
  }

  onDelete(id: number): void {
    const confirmed = window.confirm('Deseja realmente excluir esta postagem?');

    if (!confirmed) {
      return;
    }

    this.posts.update((list) => list.filter((post) => post.id !== id));
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const currentEditingId = this.editingId();

    if (currentEditingId !== null) {
      this.posts.update((list) =>
        list.map((post) =>
          post.id === currentEditingId
            ? {
                ...post,
                title: raw.title,
                description: raw.description,
                category: raw.category as PostForm['category'],
              }
            : post,
        ),
      );
    } else {
      const newPost: Post = {
        id: Date.now(),
        title: raw.title,
        description: raw.description,
        category: raw.category as PostForm['category'],
      };

      this.posts.update((list) => [...list, newPost]);
    }

    this.closeForm();
  }
}
