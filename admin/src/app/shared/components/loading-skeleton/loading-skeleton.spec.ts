import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LoadingSkeleton } from './loading-skeleton';

describe('LoadingSkeleton', () => {
  let fixture: ComponentFixture<LoadingSkeleton>;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LoadingSkeleton],
    }).compileComponents();

    fixture = TestBed.createComponent(LoadingSkeleton);
    el = fixture.nativeElement;
  });

  it('deve renderizar o numero padrao de linhas (3)', () => {
    fixture.detectChanges();
    const rows = el.querySelectorAll('div[style*="width"]');
    expect(rows.length).toBe(3);
  });

  it('deve renderizar o numero de linhas especificado', async () => {
    fixture.componentRef.setInput('rows', 5);
    fixture.detectChanges();
    await fixture.whenStable();

    const rows = el.querySelectorAll('div[style*="width"]');
    expect(rows.length).toBe(5);
  });

  it('deve aplicar a altura especificada via style.height', async () => {
    fixture.componentRef.setInput('height', '2.5rem');
    fixture.detectChanges();
    await fixture.whenStable();

    const firstRow = el.querySelector('div[style*="width"]') as HTMLElement;
    expect(firstRow?.style.height).toBe('2.5rem');
  });

  it('deve conter atributos de acessibilidade role status e aria-label', () => {
    fixture.detectChanges();
    const container = el.querySelector('div[role="status"]');
    expect(container).toBeTruthy();
    expect(container?.getAttribute('aria-label')).toBe('Carregando...');
  });
});
