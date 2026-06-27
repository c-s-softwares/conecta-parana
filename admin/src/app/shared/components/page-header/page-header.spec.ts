import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { PageHeader } from './page-header';

@Component({
  standalone: true,
  imports: [PageHeader],
  template: `
    <app-page-header
      [title]="title"
      [buttonLabel]="buttonLabel"
      (create)="onCreated()"
    />
  `,
})
class TestHost {
  title = 'NOTÍCIAS';
  buttonLabel = 'Criar notícia';
  created = false;
  onCreated(): void {
    this.created = true;
  }
}

describe('PageHeader', () => {
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

  it('deve renderizar o título', () => {
    const h1 = el.querySelector('h1');
    expect(h1?.textContent).toContain('NOTÍCIAS');
  });

  it('deve renderizar o label do botão', () => {
    const button = el.querySelector('button');
    expect(button?.textContent).toContain('Criar notícia');
  });

  it('deve emitir create ao clicar no botão', () => {
    const button = el.querySelector('button') as HTMLButtonElement;
    button.click();
    expect(host.created).toBe(true);
  });

  it('deve atualizar o título quando input muda', async () => {
    host.title = 'EVENTOS';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    const h1 = el.querySelector('h1');
    expect(h1?.textContent).toContain('EVENTOS');
  });

  it('deve atualizar o label do botão quando input muda', async () => {
    host.buttonLabel = 'Criar evento';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    const button = el.querySelector('button');
    expect(button?.textContent).toContain('Criar evento');
  });
});
