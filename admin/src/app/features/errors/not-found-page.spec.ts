import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import { NotFoundPage } from './not-found-page';

describe('NotFoundPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotFoundPage, RouterModule.forRoot([])],
    }).compileComponents();
  });

  it('renderiza código 404, título e botão de retorno', () => {
    const fixture = TestBed.createComponent(NotFoundPage);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.error-code')?.textContent?.trim()).toBe('404');
    expect(el.querySelector('.error-subtitle')?.textContent?.trim()).toBe('Página não encontrada');
    expect(el.querySelector('.error-title')?.textContent?.trim()).toBe('Não encontramos esta página');
    expect(el.querySelector('.error-description')?.textContent?.trim()).toContain(
      'O endereço digitado não existe ou foi movido',
    );

    const buttons = el.querySelectorAll('.error-actions .btn');
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent?.trim()).toContain('Voltar ao início');
    expect(buttons[1].textContent?.trim()).toContain('Voltar para o painel');
  });

  it('usa tema neutro', () => {
    const fixture = TestBed.createComponent(NotFoundPage);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.error-code.theme-neutral')).toBeTruthy();
    expect(el.querySelector('.error-icon-badge.theme-neutral')).toBeTruthy();
  });

  it('exibe pill informativa', () => {
    const fixture = TestBed.createComponent(NotFoundPage);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.error-pill')?.textContent?.trim()).toContain('Roteador ** → /404');
  });
});
