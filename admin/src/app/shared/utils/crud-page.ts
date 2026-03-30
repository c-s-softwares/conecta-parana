import { signal } from '@angular/core';
import { FormGroup } from '@angular/forms';

export abstract class CrudPage<T> {
  readonly view = signal<'list' | 'form'>('list');

  protected abstract form: FormGroup;
  protected abstract defaultFormValues(): T;

  openForm(): void {
    this.form.reset(this.defaultFormValues());
    this.view.set('form');
  }

  closeForm(): void {
    this.view.set('list');
  }
}
