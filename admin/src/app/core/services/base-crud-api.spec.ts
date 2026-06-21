import { Injectable } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { BaseCrudApi } from './base-crud-api';
import { FilterValues, PaginatedResponseDto } from './api.types';

interface TestEntity {
  id: string;
  name: string;
}

interface TestFilters extends FilterValues {
  cityId?: string | null;
  type?: string | null;
  isActive?: boolean;
  count?: number;
  empty?: string | null;
}

@Injectable({ providedIn: 'root' })
class TestEntityApi extends BaseCrudApi<TestEntity, TestFilters> {
  protected readonly endpoint = 'test';
}

const ENDPOINT = 'test';
const BASE_URL = `${environment.apiUrl}/${ENDPOINT}`;
const TEST_ID = 'tst_42';
const ITEM_URL = `${BASE_URL}/${TEST_ID}`;

const TEST_ENTITY: TestEntity = { id: TEST_ID, name: 'Gamma' };
const CREATED_ENTITY: TestEntity = { id: 'tst_99', name: 'Novo' };
const UPDATED_ENTITY: TestEntity = { id: TEST_ID, name: 'Editado' };

const CREATE_BODY = { name: 'Novo' };
const UPDATE_BODY = { name: 'Editado' };

const EMPTY_PAGE: PaginatedResponseDto<TestEntity> = {
  items: [],
  total: 0,
  page: 1,
  pageSize: 10,
};

const POPULATED_PAGE: PaginatedResponseDto<TestEntity> = {
  items: [
    { id: 'tst_1', name: 'Alpha' },
    { id: 'tst_2', name: 'Beta' },
  ],
  total: 42,
  page: 1,
  pageSize: 10,
};

describe('BaseCrudApi', () => {
  let api: TestEntityApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(TestEntityApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  describe('list', () => {
    it('deve fazer GET sem query string quando não há params', () => {
      api.list().subscribe();
      const req = http.expectOne(BASE_URL);
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys()).toHaveLength(0);
      req.flush(EMPTY_PAGE);
    });

    it('deve enviar page, pageSize e search como query params', () => {
      api.list({ page: 2, pageSize: 20, search: 'pai' }).subscribe();
      const req = http.expectOne(
        (r) => r.url === BASE_URL && r.params.toString() === 'page=2&pageSize=20&search=pai',
      );
      expect(req.request.method).toBe('GET');
      req.flush(EMPTY_PAGE);
    });

    it('deve achatar filters como query params planos', () => {
      api.list({ filters: { cityId: 'city_x', type: 'CULTURAL' } }).subscribe();
      const req = http.expectOne(
        (r) =>
          r.url === BASE_URL &&
          r.params.get('cityId') === 'city_x' &&
          r.params.get('type') === 'CULTURAL',
      );
      expect(req.request.params.has('filters')).toBe(false);
      req.flush(EMPTY_PAGE);
    });

    it('deve descartar filtros undefined, null e string vazia', () => {
      api
        .list({
          filters: { cityId: undefined, type: null, empty: '' },
        })
        .subscribe();
      const req = http.expectOne(BASE_URL);
      expect(req.request.params.keys()).toHaveLength(0);
      req.flush(EMPTY_PAGE);
    });

    it('deve enviar boolean false e number 0', () => {
      api.list({ filters: { isActive: false, count: 0 } }).subscribe();
      const req = http.expectOne((r) => r.url === BASE_URL);
      expect(req.request.params.get('isActive')).toBe('false');
      expect(req.request.params.get('count')).toBe('0');
      req.flush(EMPTY_PAGE);
    });

    it('deve retornar PaginatedResponseDto tipado', () => {
      let received: PaginatedResponseDto<TestEntity> | undefined;
      api.list().subscribe((r) => (received = r));
      http.expectOne(BASE_URL).flush(POPULATED_PAGE);
      expect(received).toEqual(POPULATED_PAGE);
    });
  });

  describe('get', () => {
    it('deve fazer GET para baseUrl/id', () => {
      let received: TestEntity | undefined;
      api.get(TEST_ID).subscribe((r) => (received = r));

      const req = http.expectOne(ITEM_URL);
      expect(req.request.method).toBe('GET');
      req.flush(TEST_ENTITY);
      expect(received).toEqual(TEST_ENTITY);
    });
  });

  describe('create', () => {
    it('deve fazer POST com body e retornar entidade criada', () => {
      let received: TestEntity | undefined;
      api.create<typeof CREATE_BODY>(CREATE_BODY).subscribe((r) => (received = r));

      const req = http.expectOne(BASE_URL);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(CREATE_BODY);
      req.flush(CREATED_ENTITY);
      expect(received).toEqual(CREATED_ENTITY);
    });
  });

  describe('update', () => {
    it('deve fazer PATCH (não PUT) com body e retornar entidade atualizada', () => {
      let received: TestEntity | undefined;
      api
        .update<typeof UPDATE_BODY>(TEST_ID, UPDATE_BODY)
        .subscribe((r) => (received = r));

      const req = http.expectOne(ITEM_URL);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(UPDATE_BODY);
      req.flush(UPDATED_ENTITY);
      expect(received).toEqual(UPDATED_ENTITY);
    });
  });

  describe('delete', () => {
    it('deve fazer DELETE e completar com 204 No Content', () => {
      let completed = false;
      api.delete(TEST_ID).subscribe({ complete: () => (completed = true) });

      const req = http.expectOne(ITEM_URL);
      expect(req.request.method).toBe('DELETE');
      req.flush(null, { status: 204, statusText: 'No Content' });
      expect(completed).toBe(true);
    });
  });

  describe('propagação de erro', () => {
    it('deve propagar erro HTTP para o callback de error', () => {
      let errorStatus: number | undefined;
      api.list().subscribe({
        error: (e: { status?: number }) => (errorStatus = e.status),
      });
      http
        .expectOne(BASE_URL)
        .flush({}, { status: 500, statusText: 'Server Error' });
      expect(errorStatus).toBe(500);
    });
  });
});
