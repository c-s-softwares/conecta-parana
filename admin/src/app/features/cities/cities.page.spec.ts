import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { CitiesPage } from './cities.page';
import { CitiesApi } from './cities.api';
import { City, CityStats } from './cities.model';
import { PaginatedResponseDto } from '../../core/services/api.types';

const CITY_A: City = { id: 'cty_1', name: 'Curitiba', state: 'PR', adminCount: 3 };
const CITY_B: City = { id: 'cty_2', name: 'Maringá', state: 'PR', adminCount: 2 };
const CITY_C: City = { id: 'cty_3', name: 'Sarandi', state: 'PR', adminCount: 0 };

const PAGE_FIRST: PaginatedResponseDto<City> = {
  items: [CITY_A, CITY_B],
  total: 12,
  page: 1,
  pageSize: 10,
};

const PAGE_SECOND: PaginatedResponseDto<City> = {
  items: [CITY_C],
  total: 12,
  page: 2,
  pageSize: 10,
};

const EMPTY_PAGE: PaginatedResponseDto<City> = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
};

const SINGLE_PAGE: PaginatedResponseDto<City> = {
  items: [CITY_A, CITY_B],
  total: 2,
  page: 1,
  pageSize: 10,
};

const STATS_FIXTURE: CityStats = {
  total: 12,
  withActiveAdmin: 8,
  awaitingAdmin: 4,
};

describe('CitiesPage', () => {
  let fixture: ComponentFixture<CitiesPage>;
  let component: CitiesPage;
  let el: HTMLElement;
  let api: CitiesApi;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CitiesPage],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(CitiesPage);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    api = TestBed.inject(CitiesApi);
    vi.spyOn(api, 'getStats').mockReturnValue(of(STATS_FIXTURE));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve carregar a primeira página ao inicializar', () => {
    const spy = vi.spyOn(api, 'list').mockReturnValue(of(PAGE_FIRST));
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledWith({ page: 1, pageSize: 10 });
    expect(component['items']()).toEqual([CITY_A, CITY_B]);
    expect(component['total']()).toBe(12);

    const rows = el.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain(CITY_A.name);
    expect(rows[0].textContent).toContain(CITY_A.state);
  });

  it('deve exibir mensagem quando lista vazia', () => {
    vi.spyOn(api, 'list').mockReturnValue(of(EMPTY_PAGE));
    fixture.detectChanges();

    expect(el.textContent).toContain('Nenhuma cidade encontrada.');
  });

  it('deve mostrar erro quando request falha', () => {
    vi.spyOn(api, 'list').mockReturnValue(throwError(() => new Error('boom')));
    fixture.detectChanges();

    expect(component['error']()).toBe('Não foi possível carregar as cidades.');
    expect(el.textContent).toContain('Não foi possível carregar');
  });

  it('deve avançar e voltar de página', () => {
    const spy = vi.spyOn(api, 'list').mockReturnValue(of(PAGE_FIRST));
    fixture.detectChanges();

    spy.mockReturnValue(of(PAGE_SECOND));
    component['nextPage']();
    expect(component['page']()).toBe(2);
    expect(spy).toHaveBeenLastCalledWith({ page: 2, pageSize: 10 });

    spy.mockReturnValue(of(PAGE_FIRST));
    component['prevPage']();
    expect(component['page']()).toBe(1);
  });

  it('não deve avançar quando não há próxima página', () => {
    const spy = vi.spyOn(api, 'list').mockReturnValue(of(SINGLE_PAGE));
    fixture.detectChanges();

    component['nextPage']();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(component['page']()).toBe(1);
  });

  it('rangeLabel deve refletir total atual', () => {
    vi.spyOn(api, 'list').mockReturnValue(of(PAGE_FIRST));
    fixture.detectChanges();
    expect(component.rangeLabel).toBe('1–2 de 12');
  });

  it('rangeLabel deve mostrar 0 de 0 quando vazio', () => {
    vi.spyOn(api, 'list').mockReturnValue(of(EMPTY_PAGE));
    fixture.detectChanges();
    expect(component.rangeLabel).toBe('0 de 0');
  });

  it('deve filtrar localmente sem fazer nova requisição', () => {
    const spy = vi.spyOn(api, 'list').mockReturnValue(of(PAGE_FIRST));
    fixture.detectChanges();
    expect(spy).toHaveBeenCalledTimes(1);

    component['searchControl'].setValue('marin');
    fixture.detectChanges();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(component['filteredItems']()).toEqual([CITY_B]);
    expect(component['items']()).toEqual([CITY_A, CITY_B]);
  });

  it('rangeLabel deve mostrar contagem da página quando há busca ativa', () => {
    vi.spyOn(api, 'list').mockReturnValue(of(PAGE_FIRST));
    fixture.detectChanges();

    component['searchControl'].setValue('marin');
    expect(component.rangeLabel).toBe('1 cidade na página atual');

    component['searchControl'].setValue('a');
    expect(component.rangeLabel).toBe('2 cidades na página atual');
  });

  it('deve desabilitar paginação quando busca local está ativa', () => {
    vi.spyOn(api, 'list').mockReturnValue(of(PAGE_FIRST));
    fixture.detectChanges();

    expect(component.canGoNext).toBe(true);
    component['searchControl'].setValue('marin');
    expect(component.canGoNext).toBe(false);
    expect(component.canGoPrev).toBe(false);
  });

  it('deve carregar e exibir stats nos cards', () => {
    vi.spyOn(api, 'list').mockReturnValue(of(PAGE_FIRST));
    fixture.detectChanges();

    expect(component['stats']()).toEqual(STATS_FIXTURE);
    const cards = el.querySelectorAll('article');
    expect(cards[0].textContent).toContain(String(STATS_FIXTURE.total));
    expect(cards[1].textContent).toContain(String(STATS_FIXTURE.withActiveAdmin));
    expect(cards[2].textContent).toContain(String(STATS_FIXTURE.awaitingAdmin));
  });

  it('stats null não deve quebrar a tela', () => {
    vi.spyOn(api, 'list').mockReturnValue(of(PAGE_FIRST));
    vi.spyOn(api, 'getStats').mockReturnValueOnce(throwError(() => new Error('boom')));
    fixture.detectChanges();

    expect(component['stats']()).toBeNull();
    const cards = el.querySelectorAll('article');
    expect(cards[1].textContent).toContain('—');
    expect(cards[2].textContent).toContain('—');
  });

  it('Desde deve ser extraído do ULID do id', () => {
    const cityWithRealUlid: City = {
      id: 'cty_01HF7VV0M0ABCDEFGHIJKLMNOP',
      name: 'Teste',
      state: 'PR',
      adminCount: 0,
    };
    vi.spyOn(api, 'list').mockReturnValue(
      of({ items: [cityWithRealUlid], total: 1, page: 1, pageSize: 10 }),
    );
    fixture.detectChanges();

    const cell = el.querySelectorAll('tbody tr td')[6];
    expect(cell?.textContent?.trim()).toMatch(/^[a-z]{3}\/\d{4}$/);
  });
});
