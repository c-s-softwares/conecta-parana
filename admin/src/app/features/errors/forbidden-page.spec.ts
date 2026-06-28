import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import { ForbiddenPage } from './forbidden-page';

describe('ForbiddenPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForbiddenPage, RouterModule.forRoot([])],
    }).compileComponents();
  });

  it('renderiza código 403, título e botão de retorno', () => {
    const fixture = TestBed.createComponent(ForbiddenPage);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.error-code')?.textContent?.trim()).toBe('403');
    expect(el.querySelector('.error-subtitle')?.textContent?.trim()).toBe('Acesso negado');
    expect(el.querySelector('.error-title')?.textContent?.trim()).toBe(
      'Você não tem acesso a esta área',
    );
    expect(el.querySelector('.error-description')?.textContent?.trim()).toContain(
      'Seu papel atual não permite acessá-la',
    );

    const buttons = el.querySelectorAll('.error-actions .btn');
    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent?.trim()).toContain('Voltar ao dashboard');
  });

  it('usa tema âmbar', () => {
    const fixture = TestBed.createComponent(ForbiddenPage);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.error-code.theme-amber')).toBeTruthy();
    expect(el.querySelector('.error-icon-badge.theme-amber')).toBeTruthy();
  });

  it('não exibe pill de implementação', () => {
    const fixture = TestBed.createComponent(ForbiddenPage);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.error-pill')).toBeNull();
  });
});
