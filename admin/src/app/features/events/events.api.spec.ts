import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { EventsApi } from './events.api';

const BASE_URL = `${environment.apiUrl}/events`;
const EVENT_ID = 'event_01';
const ITEM_URL = `${BASE_URL}/${EVENT_ID}`;
const UPDATE_BODY = { title: 'Editado', updatedAt: '2030-01-01T10:00:00.000Z' };

describe('EventsApi', () => {
  let api: EventsApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    api = TestBed.inject(EventsApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('update() emite PUT (não PATCH) para /events/:id', () => {
    api.update(EVENT_ID, UPDATE_BODY).subscribe();

    const req = http.expectOne(ITEM_URL);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(UPDATE_BODY);
    req.flush({});
  });

  it('get() faz GET em /events/:id (detalhe)', () => {
    api.get(EVENT_ID).subscribe();

    const req = http.expectOne(ITEM_URL);
    expect(req.request.method).toBe('GET');
    req.flush({});
  });
});
