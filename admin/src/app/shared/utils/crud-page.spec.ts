import { FormBuilder, FormGroup } from '@angular/forms';
import { CrudPage } from './crud-page';

interface TestFormValues {
  name: string;
}

class TestPage extends CrudPage<TestFormValues> {
  form: FormGroup;

  constructor() {
    super();
    const fb = new FormBuilder();
    this.form = fb.nonNullable.group({ name: [''] });
  }

  defaultFormValues(): TestFormValues {
    return { name: 'default' };
  }
}

describe('CrudPage', () => {
  let page: TestPage;

  beforeEach(() => {
    page = new TestPage();
  });

  it('deve iniciar com view "list"', () => {
    expect(page.view()).toBe('list');
  });

  it('openForm deve mudar view para "form"', () => {
    page.openForm();
    expect(page.view()).toBe('form');
  });

  it('openForm deve resetar o formulário com valores default', () => {
    page.form.patchValue({ name: 'alterado' });
    page.openForm();
    expect(page.form.value).toEqual({ name: 'default' });
  });

  it('closeForm deve mudar view para "list"', () => {
    page.openForm();
    expect(page.view()).toBe('form');
    page.closeForm();
    expect(page.view()).toBe('list');
  });

  it('deve alternar entre list e form múltiplas vezes', () => {
    expect(page.view()).toBe('list');
    page.openForm();
    expect(page.view()).toBe('form');
    page.closeForm();
    expect(page.view()).toBe('list');
    page.openForm();
    expect(page.view()).toBe('form');
  });
});
