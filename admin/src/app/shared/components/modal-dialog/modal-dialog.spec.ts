import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalDialog } from './modal-dialog';

@Component({
  standalone: true,
  imports: [ModalDialog],
  template: `
    <app-modal-dialog
      [visible]="visible"
      [title]="title"
      [size]="size"
      [dismissOnBackdrop]="dismissOnBackdrop"
      (cancelled)="onCancel()"
    >
      <p id="test-content">Conteúdo do Modal</p>
      <button id="btn1">Botão 1</button>
      <button id="btn2">Botão 2</button>
    </app-modal-dialog>
  `,
})
class TestHost {
  visible = false;
  title = '';
  size: 's' | 'm' | 'l' = 'm';
  dismissOnBackdrop = true;

  cancelCalled = false;

  onCancel() {
    this.cancelCalled = true;
  }
}

describe('ModalDialog', () => {
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

  it('nao deve renderizar nada no DOM quando visible e false', () => {
    const dialog = el.querySelector('[role="dialog"]');
    expect(dialog).toBeNull();
  });

  it('deve renderizar o dialog e o conteudo projetado quando visible e true', async () => {
    host.visible = true;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    const dialog = el.querySelector('[role="dialog"]');
    const content = el.querySelector('#test-content');
    expect(dialog).toBeTruthy();
    expect(content?.textContent).toContain('Conteúdo do Modal');
  });

  it('deve emitir cancel ao pressionar ESC', async () => {
    host.visible = true;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    host.cancelCalled = false;
    const escEvent = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    document.dispatchEvent(escEvent);
    fixture.detectChanges();

    expect(host.cancelCalled).toBe(true);
  });

  it('deve emitir cancel ao clicar no backdrop se dismissOnBackdrop for true', async () => {
    host.visible = true;
    host.dismissOnBackdrop = true;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    host.cancelCalled = false;
    const backdrop = el.querySelector('.fixed.inset-0') as HTMLElement;
    backdrop.click();
    fixture.detectChanges();

    expect(host.cancelCalled).toBe(true);
  });

  it('nao deve emitir cancel ao clicar no backdrop se dismissOnBackdrop for false', async () => {
    host.visible = true;
    host.dismissOnBackdrop = false;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    host.cancelCalled = false;
    const backdrop = el.querySelector('.fixed.inset-0') as HTMLElement;
    backdrop.click();
    fixture.detectChanges();

    expect(host.cancelCalled).toBe(false);
  });

  it('nao deve emitir cancel ao clicar no painel interno do dialog', async () => {
    host.visible = true;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    host.cancelCalled = false;
    const dialogPanel = el.querySelector('[role="dialog"]') as HTMLElement;
    dialogPanel.click();
    fixture.detectChanges();

    expect(host.cancelCalled).toBe(false);
  });

  it('deve emitir cancel ao clicar no botao X', async () => {
    host.visible = true;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    host.cancelCalled = false;
    const closeBtn = el.querySelector('button[aria-label="Fechar modal"]') as HTMLButtonElement;
    closeBtn.click();
    fixture.detectChanges();

    expect(host.cancelCalled).toBe(true);
  });

  it('deve aplicar classe de tamanho correta para s, m, l', async () => {
    host.visible = true;
    host.size = 's';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    let dialogPanel = el.querySelector('[role="dialog"]');
    expect(dialogPanel?.classList.contains('max-w-sm')).toBe(true);

    host.size = 'l';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    dialogPanel = el.querySelector('[role="dialog"]');
    expect(dialogPanel?.classList.contains('max-w-3xl')).toBe(true);
  });

  it('deve ter role="dialog", aria-modal="true" e aria-labelledby corretos', async () => {
    host.visible = true;
    host.title = 'Título Teste';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    const dialogPanel = el.querySelector('[role="dialog"]');
    expect(dialogPanel?.getAttribute('role')).toBe('dialog');
    expect(dialogPanel?.getAttribute('aria-modal')).toBe('true');
    expect(dialogPanel?.getAttribute('aria-labelledby')).toBe('modal-title');

    const titleEl = el.querySelector('#modal-title');
    expect(titleEl?.textContent?.trim()).toBe('Título Teste');
  });

  it('deve focar o dialog ao abrir', async () => {
    host.visible = true;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    await new Promise(resolve => setTimeout(resolve, 0));

    const dialogPanel = el.querySelector('[role="dialog"]') as HTMLElement;
    expect(document.activeElement).toBe(dialogPanel);
  });

  it('deve bloquear a rolagem do body quando visivel e liberar ao fechar ou destruir', async () => {
    host.visible = true;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.body.classList.contains('overflow-hidden')).toBe(true);

    host.visible = false;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.body.classList.contains('overflow-hidden')).toBe(false);
  });

  it('deve ciclar o foco (focus trap) ao navegar com a tecla Tab', async () => {
    host.visible = true;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    const dialogPanel = el.querySelector('[role="dialog"]') as HTMLElement;
    const closeBtn = el.querySelector('button[aria-label="Fechar modal"]') as HTMLElement;
    const btn2 = el.querySelector('#btn2') as HTMLElement;

    btn2.focus();
    expect(document.activeElement).toBe(btn2);

    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: false });
    dialogPanel.dispatchEvent(tabEvent);
    fixture.detectChanges();
    expect(document.activeElement).toBe(closeBtn);


    const shiftTabEvent = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true });
    dialogPanel.dispatchEvent(shiftTabEvent);
    fixture.detectChanges();
    expect(document.activeElement).toBe(btn2);
  });
});
