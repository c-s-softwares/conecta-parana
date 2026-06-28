import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import { ServerErrorPage } from './server-error-page';

describe('ServerErrorPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServerErrorPage, RouterModule.forRoot([])],
    }).compileComponents();
  });

  it('renderiza código 500, título e botão de retorno', () => {
    const fixture = TestBed.createComponent(ServerErrorPage);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.error-code')?.textContent?.trim()).toBe('500');
    expect(el.querySelector('.error-subtitle')?.textContent?.trim()).toBe(
      'Erro interno do servidor',
    );
    expect(el.querySelector('.error-title')?.textContent?.trim()).toBe('Algo deu errado');
    expect(el.querySelector('.error-description')?.textContent?.trim()).toContain(
      'Tivemos um problema ao processar sua solicitação',
    );

    const buttons = el.querySelectorAll('.error-actions .btn');
    expect(buttons.length).toBe(1);
    expect(buttons[0].textContent?.trim()).toContain('Voltar ao dashboard');
  });

  it('usa tema coral', () => {
    const fixture = TestBed.createComponent(ServerErrorPage);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.error-code.theme-coral')).toBeTruthy();
    expect(el.querySelector('.error-icon-badge.theme-coral')).toBeTruthy();
  });

  it('não exibe pill de implementação', () => {
    const fixture = TestBed.createComponent(ServerErrorPage);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.error-pill')).toBeNull();
  });
});
