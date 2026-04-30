import { signal } from '@angular/core';
import { FormGroup } from '@angular/forms';

export abstract class CrudPage<T> {
  readonly view = signal<'list' | 'form'>('list');
  readonly editingId = signal<string | number | null>(null);

  protected abstract form: FormGroup;
  protected abstract defaultFormValues(): T;

  get isEditing(): boolean {
    return this.editingId() !== null;
  }

  openForm(): void {
    this.editingId.set(null);
    this.form.reset(this.defaultFormValues());
    this.view.set('form');
  }

  closeForm(): void {
    this.editingId.set(null);
    this.view.set('list');
  }
}
