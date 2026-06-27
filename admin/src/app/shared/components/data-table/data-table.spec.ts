import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DataTable, DataTableColumn, DataTableSortEvent, DataTablePageEvent, DataTableActionEvent } from './data-table';

@Component({
  standalone: true,
  imports: [DataTable],
  template: `
    <app-data-table
      [columns]="columns"
      [items]="items"
      [total]="total"
      [page]="page"
      [pageSize]="pageSize"
      [loading]="loading"
      [actions]="actions"
      [emptyTitle]="emptyTitle"
      [emptyDescription]="emptyDescription"
      [trackBy]="trackBy"
      (sort)="onSort($event)"
      (pageChange)="onPageChange($event)"
      (action)="onAction($event)"
    />
  `,
})
class TestHost {
  columns: DataTableColumn[] = [
    { key: 'name', label: 'Nome', sortable: true },
    { key: 'category', label: 'Categoria', sortable: false },
  ];
  items = [
    { id: '1', name: 'Local A', category: 'Parque' },
    { id: '2', name: 'Local B', category: 'Restaurante' },
  ];
  total = 2;
  page = 1;
  pageSize = 10;
  loading = false;
  actions: string[] = [];
  emptyTitle = 'Nenhum item';
  emptyDescription = 'Tente novamente';
  trackBy = 'id';

  lastSortEvent?: DataTableSortEvent;
  lastPageEvent?: DataTablePageEvent;
  lastActionEvent?: DataTableActionEvent;

  onSort(event: DataTableSortEvent) {
    this.lastSortEvent = event;
  }

  onPageChange(event: DataTablePageEvent) {
    this.lastPageEvent = event;
  }

  onAction(event: DataTableActionEvent) {
    this.lastActionEvent = event;
  }
}

describe('DataTable', () => {
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

  it('deve renderizar os headers das colunas e valores das celulas', () => {
    const headers = el.querySelectorAll('th');
    expect(headers[0].textContent).toContain('Nome');
    expect(headers[1].textContent).toContain('Categoria');

    const cells = el.querySelectorAll('td');
    expect(cells[0].textContent).toContain('Local A');
    expect(cells[1].textContent).toContain('Parque');
    expect(cells[2].textContent).toContain('Local B');
    expect(cells[3].textContent).toContain('Restaurante');
  });

  it('deve mostrar LoadingSkeleton e esconder a tabela quando loading e true', async () => {
    host.loading = true;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    const skeleton = el.querySelector('app-loading-skeleton');
    const table = el.querySelector('table');
    expect(skeleton).toBeTruthy();
    expect(table).toBeNull();
  });

  it('deve mostrar EmptyState e esconder a tabela quando items e vazio e loading e false', async () => {
    host.items = [];
    host.total = 0;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    const emptyState = el.querySelector('app-empty-state');
    const table = el.querySelector('table');
    expect(emptyState).toBeTruthy();
    expect(table).toBeNull();
    expect(emptyState?.textContent).toContain('Nenhum item');
    expect(emptyState?.textContent).toContain('Tente novamente');
  });

  it('deve emitir evento de ordenacao ao clicar em header ordenavel', async () => {
    const sortableHeader = el.querySelectorAll('th')[0];
    sortableHeader.click();
    fixture.detectChanges();

    expect(host.lastSortEvent).toEqual({ column: 'name', direction: 'asc' });

    sortableHeader.click();
    fixture.detectChanges();
    expect(host.lastSortEvent).toEqual({ column: 'name', direction: 'desc' });

    sortableHeader.click();
    fixture.detectChanges();
    expect(host.lastSortEvent).toEqual({ column: '', direction: '' });
  });

  it('nao deve emitir evento de ordenacao ao clicar em header nao ordenavel', async () => {
    host.lastSortEvent = undefined;
    const nonSortableHeader = el.querySelectorAll('th')[1];
    nonSortableHeader.click();
    fixture.detectChanges();

    expect(host.lastSortEvent).toBeUndefined();
  });

  it('deve emitir pageChange ao clicar no botao de proxima pagina', async () => {
    host.total = 15;
    host.pageSize = 10;
    host.page = 1;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    const nextBtn = el.querySelector('button[aria-label="Próxima página"]') as HTMLButtonElement;
    expect(nextBtn.disabled).toBe(false);

    nextBtn.click();
    fixture.detectChanges();

    expect(host.lastPageEvent).toEqual({ page: 2, pageSize: 10 });
  });

  it('deve desabilitar os botoes anterior/proximo quando na primeira/ultima pagina', async () => {
    host.total = 10;
    host.pageSize = 10;
    host.page = 1;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    const prevBtn = el.querySelector('button[aria-label="Página anterior"]') as HTMLButtonElement;
    const nextBtn = el.querySelector('button[aria-label="Próxima página"]') as HTMLButtonElement;

    expect(prevBtn.disabled).toBe(true);
    expect(nextBtn.disabled).toBe(true);
  });

  it('deve renderizar os botoes de acoes e emitir eventos de acao', async () => {
    host.actions = ['edit', 'delete'];
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    const actionHeaders = el.querySelectorAll('th');
    expect(actionHeaders[2].textContent).toContain('Ações');

    const editBtn = el.querySelector('button.bg-blue-500') as HTMLButtonElement;
    const deleteBtn = el.querySelector('button.bg-red-500') as HTMLButtonElement;

    expect(editBtn.textContent?.trim()).toBe('Editar');
    expect(deleteBtn.textContent?.trim()).toBe('Excluir');

    editBtn.click();
    fixture.detectChanges();
    expect(host.lastActionEvent).toEqual({ action: 'edit', item: host.items[0] });

    deleteBtn.click();
    fixture.detectChanges();
    expect(host.lastActionEvent).toEqual({ action: 'delete', item: host.items[0] });
  });

  it('deve alternar a ordenacao ao pressionar Enter ou Space no cabeçalho sortable', async () => {
    const headers = el.querySelectorAll('th');
    const nameHeader = headers[0];

    nameHeader.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    fixture.detectChanges();
    expect(host.lastSortEvent).toEqual({ column: 'name', direction: 'asc' });

    nameHeader.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
    fixture.detectChanges();
    expect(host.lastSortEvent).toEqual({ column: 'name', direction: 'desc' });
  });

  it('deve renderizar ellipsis na paginacao quando houver muitas paginas', async () => {
    host.total = 100;
    host.pageSize = 10;
    host.page = 5;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    await fixture.whenStable();

    const nav = el.querySelector('nav');
    expect(nav?.textContent).toContain('...');
  });

  it('deve ter role="table" e th com scope="col" para acessibilidade', () => {
    const table = el.querySelector('table');
    expect(table?.getAttribute('role')).toBe('table');

    const headers = el.querySelectorAll('th');
    headers.forEach(h => {
      expect(h.getAttribute('scope')).toBe('col');
    });
  });
});
