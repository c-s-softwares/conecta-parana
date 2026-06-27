import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataList, DataListPageEvent } from './data-list';

@Component({
  standalone: true,
  imports: [DataList],
  template: `
    <app-data-list
      [items]="items"
      [total]="total"
      [page]="page"
      [pageSize]="pageSize"
      [loading]="loading"
      [emptyTitle]="emptyTitle"
      [emptyDescription]="emptyDescription"
      (pageChange)="onPageChange($event)"
    >
      <ng-template #row let-item>
        <div class="list-item"><span class="title">{{ item.name }}</span></div>
      </ng-template>
    </app-data-list>
  `,
})
class TestHost {
  items: Record<string, unknown>[] = [
    { id: '1', name: 'Local A' },
    { id: '2', name: 'Local B' },
  ];
  total = 2;
  page = 1;
  pageSize = 5;
  loading = false;
  emptyTitle = 'Nenhum item';
  emptyDescription = 'Tente novamente';

  lastPageEvent?: DataListPageEvent;
  onPageChange(event: DataListPageEvent) {
    this.lastPageEvent = event;
  }
}

describe('DataList', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;
  let el: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  it('deve renderizar uma linha por item usando o template projetado', () => {
    const rows = el.querySelectorAll('.list-item');
    expect(rows.length).toBe(2);
    expect(rows[0].textContent).toContain('Local A');
    expect(rows[1].textContent).toContain('Local B');
  });

  it('deve mostrar LoadingSkeleton e esconder as linhas quando loading e true', async () => {
    host.loading = true;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(el.querySelector('app-loading-skeleton')).toBeTruthy();
    expect(el.querySelector('.list-item')).toBeNull();
  });

  it('deve mostrar EmptyState quando items e vazio e loading e false', async () => {
    host.items = [];
    host.total = 0;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    const empty = el.querySelector('app-empty-state');
    expect(empty).toBeTruthy();
    expect(el.querySelector('.list-item')).toBeNull();
    expect(empty?.textContent).toContain('Nenhum item');
  });

  it('nao deve renderizar paginacao quando ha apenas uma pagina', () => {
    expect(el.querySelector('nav[aria-label="Paginação"]')).toBeNull();
  });

  it('deve emitir pageChange ao clicar em proxima pagina', async () => {
    host.total = 15;
    host.page = 1;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    const nextBtn = el.querySelector('button[aria-label="Próxima página"]') as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(false);

    nextBtn.click();
    fixture.detectChanges();
    expect(host.lastPageEvent).toEqual({ page: 2, pageSize: 5 });
  });

  it('deve desabilitar anterior na primeira pagina e proximo na ultima', async () => {
    host.total = 15;
    host.page = 1;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    expect((el.querySelector('button[aria-label="Página anterior"]') as HTMLButtonElement).disabled).toBe(true);

    host.page = 3;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();
    expect((el.querySelector('button[aria-label="Próxima página"]') as HTMLButtonElement).disabled).toBe(true);
  });

  it('deve renderizar ellipsis quando ha muitas paginas', async () => {
    host.total = 100;
    host.pageSize = 10;
    host.page = 5;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    const nav = el.querySelector('nav[aria-label="Paginação"]');
    expect(nav?.textContent).toContain('…');
  });
});
