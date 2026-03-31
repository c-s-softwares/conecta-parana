import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormField } from './form-field';

@Component({
  standalone: true,
  imports: [FormField],
  template: `
    <app-form-field
      [label]="label"
      [fieldId]="fieldId"
      [required]="required"
      [showError]="showError"
      [errorMessage]="errorMessage"
    >
      <input [id]="fieldId" />
    </app-form-field>
  `,
})
class TestHost {
  label = 'Título';
  fieldId = 'title';
  required = false;
  showError = false;
  errorMessage = '';
}

describe('FormField', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();

    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('deve renderizar o label com texto correto', () => {
    const label = el.querySelector('label');
    expect(label?.textContent).toContain('Título');
  });

  it('deve associar o label ao fieldId via for', () => {
    const label = el.querySelector('label');
    expect(label?.getAttribute('for')).toBe('title');
  });

  it('não deve mostrar asterisco quando required é false', () => {
    const span = el.querySelector('label span');
    expect(span).toBeNull();
  });

  it('deve mostrar asterisco vermelho quando required é true', async () => {
    host.required = true;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    const span = el.querySelector('label span');
    expect(span?.textContent).toContain('*');
    expect(span?.classList.contains('text-red-600')).toBe(true);
  });

  it('não deve mostrar mensagem de erro quando showError é false', async () => {
    host.errorMessage = 'Erro qualquer';
    host.showError = false;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    const p = el.querySelector('p');
    expect(p).toBeNull();
  });

  it('deve mostrar mensagem de erro quando showError é true', async () => {
    host.errorMessage = 'Campo obrigatório.';
    host.showError = true;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    const p = el.querySelector('p');
    expect(p?.textContent).toContain('Campo obrigatório.');
  });

  it('deve projetar o conteúdo (ng-content)', () => {
    const input = el.querySelector('input#title');
    expect(input).toBeTruthy();
  });
});
