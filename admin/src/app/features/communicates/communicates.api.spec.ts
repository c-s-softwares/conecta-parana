import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { ComunicadosApi } from './communicates.api';

const BASE_URL = `${environment.apiUrl}/communicates`;

describe('ComunicadosApi', () => {
  let api: ComunicadosApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(ComunicadosApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('list() faz GET em /communicates com params de paginação', () => {
    api.list({ page: 1, pageSize: 10 }).subscribe();

    const req = http.expectOne((r) => r.url === BASE_URL);
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0, page: 1, pageSize: 10 });
  });
});
