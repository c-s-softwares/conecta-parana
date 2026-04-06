import { Component, inject, signal, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CrudPage } from '../../shared/utils/crud-page';
import { PageHeader } from '../../shared/components/page-header';
import { FormContainer } from '../../shared/components/form-container';
import { FormField } from '../../shared/components/form-field';

interface NotificationFormValues {
  id: string;
  title: string;
  description: string;
  type: string;
}

const STORAGE_KEY = 'notifications';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [ReactiveFormsModule, PageHeader, FormContainer, FormField],
  templateUrl: 'notification.page.html',
})

export class NotificationComponent extends CrudPage<NotificationFormValues> implements OnInit {

  private readonly fb = inject(FormBuilder);
  private editingId = signal<string | null>(null);

  protected readonly form = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    description: ['', [Validators.required, Validators.minLength(10)]],
    type: ['', Validators.required],
  });

  protected defaultFormValues(): NotificationFormValues {
    return { id: '', title: '', description: '', type: '' };
  }

  getAll(): NotificationFormValues[] {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  }

  private saveAll(notifications: NotificationFormValues[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  }

  private create(values: Omit<NotificationFormValues, 'id'>): void {
    const notifications = this.getAll();
    const newNotification: NotificationFormValues = {
      ...values,
      id: crypto.randomUUID(),
    };
    notifications.push(newNotification);
    this.saveAll(notifications);
    console.log('Notificação criada:', newNotification);
  }

  update(id: string, values: Partial<NotificationFormValues>): void {
    const notifications = this.getAll();
    const index = notifications.findIndex((n) => n.id === id);

    if (index === -1) {
      console.warn('Notificação não encontrada:', id);
      return;
    }

    notifications[index] = { ...notifications[index], ...values };
    this.saveAll(notifications);
    console.log('Notificação atualizada:', notifications[index]);
  }

  delete(id: string): void {
    const notifications = this.getAll().filter((n) => n.id !== id);
    this.saveAll(notifications);
    console.log('Notificação deletada, id:', id);
  }

  openEditForm(id: string): void {
    const notification = this.getAll().find((n) => n.id === id);

    if (!notification) {
      console.warn('Notificação não encontrada:', id);
      return;
    }

    this.editingId.set(id);
    this.form.patchValue(notification);
    this.view.set('form');
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

    const values = this.form.getRawValue();
    const id = this.editingId();

    if (id) {
      this.update(id, values);
    } else {
      this.create(values);
    }

    this.editingId.set(null);
    this.form.reset();
    this.view.set('list');
  }

  ngOnInit(): void {
    (window as unknown as Record<string, unknown>)['notification'] = this;
  }
}