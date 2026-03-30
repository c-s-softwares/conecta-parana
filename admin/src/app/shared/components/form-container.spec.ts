import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { FormContainer } from './form-container';

@Component({
  standalone: true,
  imports: [FormContainer],
  template: `
    <app-form-container [title]="title">
      <p class="projected">Conteúdo projetado</p>
    </app-form-container>
  `,
})
class TestHost {
  title = 'CRIAR NOTÍCIA';
}

describe('FormContainer', () => {
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
    expect(h1?.textContent).toContain('CRIAR NOTÍCIA');
  });

  it('deve projetar o conteúdo via ng-content', () => {
    const p = el.querySelector('p.projected');
    expect(p?.textContent).toContain('Conteúdo projetado');
  });

  it('deve atualizar o título quando input muda', async () => {
    host.title = 'CRIAR EVENTO';
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    const h1 = el.querySelector('h1');
    expect(h1?.textContent).toContain('CRIAR EVENTO');
  });
});
