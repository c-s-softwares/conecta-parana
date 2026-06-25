import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NgIcon } from '@ng-icons/core';
import { EmptyState } from './empty-state';

describe('EmptyState', () => {
  let fixture: ComponentFixture<EmptyState>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmptyState],
    }).compileComponents();

    fixture = TestBed.createComponent(EmptyState);
    el = fixture.nativeElement;
  });

  it('deve exibir o titulo padrao se nao fornecido', () => {
    fixture.detectChanges();
    const titleEl = el.querySelector('h3');
    expect(titleEl?.textContent?.trim()).toBe('Nenhum item encontrado');
  });

  it('deve exibir o titulo e a descricao fornecidos', async () => {
    fixture.componentRef.setInput('title', 'Tabela Vazia');
    fixture.componentRef.setInput('description', 'Tente ajustar os filtros.');
    fixture.detectChanges();
    await fixture.whenStable();

    const titleEl = el.querySelector('h3');
    const descEl = el.querySelector('p');
    expect(titleEl?.textContent?.trim()).toBe('Tabela Vazia');
    expect(descEl?.textContent?.trim()).toBe('Tente ajustar os filtros.');
  });

  it('deve renderizar o svg padrao (inbox) se nenhum icon for fornecido', () => {
    fixture.detectChanges();
    const ngIconEl = fixture.debugElement.query(By.directive(NgIcon));
    expect(ngIconEl).toBeTruthy();
    const nameProp = ngIconEl.componentInstance.name;
    const nameVal = typeof nameProp === 'function' ? nameProp() : nameProp;
    expect(nameVal).toBe('heroInbox');
  });

  it('deve renderizar o svg especificado se fornecido', async () => {
    fixture.componentRef.setInput('icon', 'trash');
    fixture.detectChanges();
    await fixture.whenStable();

    const ngIconEl = fixture.debugElement.query(By.directive(NgIcon));
    expect(ngIconEl).toBeTruthy();
    const nameProp = ngIconEl.componentInstance.name;
    const nameVal = typeof nameProp === 'function' ? nameProp() : nameProp;
    expect(nameVal).toBe('heroTrash');
  });
});
