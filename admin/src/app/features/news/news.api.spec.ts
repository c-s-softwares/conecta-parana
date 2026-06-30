import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { NewsApi } from './news.api';

const BASE_URL = `${environment.apiUrl}/news`;
const NEWS_ID = 'nws_001';

describe('NewsApi', () => {
  let api: NewsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(NewsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('get() faz GET em /news/:id para buscar detalhe', () => {
    api.get(NEWS_ID).subscribe();

    const req = http.expectOne(`${BASE_URL}/${NEWS_ID}`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('list() faz GET em /news com params de paginação', () => {
    api.list({ page: 1, pageSize: 10 }).subscribe();

    const req = http.expectOne((r) => r.url === BASE_URL);
    expect(req.request.method).toBe('GET');
    req.flush({ items: [], total: 0, page: 1, pageSize: 10 });
  });
});
