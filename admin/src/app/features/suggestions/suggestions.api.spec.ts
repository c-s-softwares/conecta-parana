import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { SugestoesApi } from './suggestions.api';
import { environment } from '../../../environments/environment';
import { describe, beforeEach, afterEach, it, expect } from 'vitest';

describe('SugestoesApi', () => {
  let service: SugestoesApi;
  let httpMock: HttpTestingController;
  const baseUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SugestoesApi,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(SugestoesApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should call listCitySuggestions', () => {
    service.listCitySuggestions().subscribe((res) => {
      expect(res).toEqual([]);
    });

    const req = httpMock.expectOne(`${baseUrl}/suggestions`);
    expect(req.request.method).toBe('GET');
    req.flush([]);
  });

  it('should call getSuggestionDetail', () => {
    const id = '123';
    service.getSuggestionDetail(id).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/suggestions/${id}`);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });

  it('should call respond', () => {
    const id = '123';
    const responseText = 'Resposta teste';
    service.respond(id, responseText).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/suggestions/${id}/respond`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ response: responseText });
    req.flush({});
  });

  it('should call conclude', () => {
    const id = '123';
    const responseText = 'Conclusão teste';
    service.conclude(id, responseText).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/suggestions/${id}/conclude`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ response: responseText });
    req.flush({});
  });

  it('should call archive', () => {
    const id = '123';
    const responseText = 'Arquivado por falta de nexo';
    service.archive(id, responseText).subscribe();

    const req = httpMock.expectOne(`${baseUrl}/suggestions/${id}/archive`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual({ response: responseText });
    req.flush({});
  });
});
