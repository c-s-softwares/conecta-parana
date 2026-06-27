import { TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';

import { ServerErrorPage } from './server-error-page';

describe('ServerErrorPage', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ServerErrorPage, RouterModule.forRoot([])],
    }).compileComponents();
  });

  it('renderiza código 500, título e botões', () => {
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
    expect(buttons.length).toBe(2);
    expect(buttons[0].textContent?.trim()).toContain('Voltar ao início');
    expect(buttons[1].textContent?.trim()).toContain('Tentar novamente');
  });

  it('usa tema coral', () => {
    const fixture = TestBed.createComponent(ServerErrorPage);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.error-code.theme-coral')).toBeTruthy();
    expect(el.querySelector('.error-icon-badge.theme-coral')).toBeTruthy();
  });

  it('exibe pill informativa', () => {
    const fixture = TestBed.createComponent(ServerErrorPage);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    expect(el.querySelector('.error-pill')?.textContent?.trim()).toContain('HTTP 500');
  });

  it('botão "Tentar novamente" chama window.location.reload', () => {
    const fixture = TestBed.createComponent(ServerErrorPage);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    const reloadFn = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { ...window.location, reload: reloadFn },
      writable: true,
      configurable: true,
    });

    const retryBtn = el.querySelectorAll('.error-actions .btn')[1] as HTMLButtonElement;
    retryBtn.click();
    expect(reloadFn).toHaveBeenCalled();
  });
});
