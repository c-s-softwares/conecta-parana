import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { environment } from '../../../environments/environment';
import { EventFormModal } from './event-form-modal';
import { ToastService } from '../../core/services/toast.service';
import { EventDetail, EventItem } from './events.model';

const EVENTS_URL = `${environment.apiUrl}/events`;
const UPLOADS_URL = `${environment.apiUrl}/uploads/photos`;
const EVENT_ID = 'event_01';
const UPDATED_AT = '2030-01-01T10:00:00.000Z';

const EXISTING: EventItem = {
  id: EVENT_ID,
  title: 'Festa Junina',
  description: 'Evento da cidade',
  type: 'cultural',
  isActive: true,
  eventDate: '2030-06-12T19:00:00.000Z',
  cityId: 'cit_1',
  userId: 'usr_1',
  localId: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: UPDATED_AT,
  photos: [],
};

const DETAIL: EventDetail = {
  ...EXISTING,
  likesCount: 0,
  liked: false,
  saved: false,
};

describe('EventFormModal', () => {
  let fixture: ComponentFixture<EventFormModal>;
  let el: HTMLElement;
  let http: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2030-06-01T08:00:00'));
    URL.createObjectURL = vi.fn(() => 'blob:mock');
    URL.revokeObjectURL = vi.fn();

    TestBed.configureTestingModule({
      imports: [EventFormModal],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ToastService, useValue: { show: () => undefined } },
      ],
    });

    fixture = TestBed.createComponent(EventFormModal);
    el = fixture.nativeElement as HTMLElement;
    http = TestBed.inject(HttpTestingController);
    fixture.componentRef.setInput('event', null);
    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    vi.useRealTimers();
  });

  function openCreate(): void {
    fixture.componentRef.setInput('event', null);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  }

  function openEdit(): void {
    fixture.componentRef.setInput('event', EXISTING);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
    http.expectOne(`${EVENTS_URL}/${EVENT_ID}`).flush(DETAIL);
    fixture.detectChanges();
  }

  function setValue(selector: string, value: string): void {
    const input = el.querySelector(selector) as
      | HTMLInputElement
      | HTMLTextAreaElement
      | HTMLSelectElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
  }

  function pickDate(day: string, time: string): void {
    const trigger = el.querySelector(
      'app-date-time-picker button',
    ) as HTMLButtonElement;
    trigger.click();
    fixture.detectChanges();

    const dayButton = Array.from(
      el.querySelectorAll('app-date-time-picker button'),
    ).find(
      (b) =>
        b.textContent?.trim() === day &&
        (b as HTMLElement).style.opacity === '',
    ) as HTMLButtonElement;
    dayButton.click();

    const timeInput = el.querySelector(
      'app-date-time-picker input',
    ) as HTMLInputElement;
    timeInput.value = time;
    timeInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  function clickButtonWithText(text: string): void {
    const button = Array.from(el.querySelectorAll('button')).find((b) =>
      b.textContent?.includes(text),
    );
    button?.click();
    fixture.detectChanges();
  }

  it('cria evento via POST e emite saved', () => {
    openCreate();
    setValue('#event-title', 'Festival de Inverno');
    setValue('#event-description', 'Uma descrição');
    setValue('#event-type', 'cultural');
    pickDate('20', '19:00');

    let saved = false;
    fixture.componentInstance.saved.subscribe(() => (saved = true));

    clickButtonWithText('Criar evento');

    const req = http.expectOne(EVENTS_URL);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toMatchObject({
      title: 'Festival de Inverno',
      type: 'cultural',
      isActive: true,
    });
    req.flush({ ...EXISTING, id: 'event_new' });
    expect(saved).toBe(true);
  });

  it('edita evento via PUT enviando updatedAt para o lock otimista', () => {
    openEdit();
    setValue('#event-title', 'Festa Junina editada');

    clickButtonWithText('Salvar alterações');

    const req = http.expectOne(`${EVENTS_URL}/${EVENT_ID}`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toMatchObject({
      title: 'Festa Junina editada',
      updatedAt: UPDATED_AT,
    });
    req.flush(EXISTING);
  });

  it('mantém o modal aberto em 409 event_changed', () => {
    openEdit();
    setValue('#event-title', 'Conflito');

    let saved = false;
    let closed = false;
    fixture.componentInstance.saved.subscribe(() => (saved = true));
    fixture.componentInstance.closed.subscribe(() => (closed = true));

    clickButtonWithText('Salvar alterações');

    const req = http.expectOne(`${EVENTS_URL}/${EVENT_ID}`);
    req.flush(
      { code: 'event_changed', message: 'conflito' },
      { status: 409, statusText: 'Conflict' },
    );
    fixture.detectChanges();

    expect(saved).toBe(false);
    expect(closed).toBe(false);
  });

  it('envia as fotos apenas ao salvar e segue mesmo com erro de upload', () => {
    openCreate();
    setValue('#event-title', 'Com foto');
    setValue('#event-description', 'Uma descrição');
    setValue('#event-type', 'cultural');
    pickDate('20', '19:00');

    const fileInput = el.querySelector(
      'input[type="file"]',
    ) as HTMLInputElement;
    const file = new File(['x'], 'foto.jpg', { type: 'image/jpeg' });
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true,
    });
    fileInput.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    // Nada é enviado ao adicionar a foto.
    http.expectNone(UPLOADS_URL);

    let saved = false;
    fixture.componentInstance.saved.subscribe(() => (saved = true));

    clickButtonWithText('Criar evento');

    const createReq = http.expectOne(EVENTS_URL);
    expect(createReq.request.method).toBe('POST');
    createReq.flush({ ...EXISTING, id: 'event_new' });

    const uploadReq = http.expectOne(UPLOADS_URL);
    expect(uploadReq.request.method).toBe('POST');
    uploadReq.flush(
      { code: 'file_too_large', message: 'grande' },
      { status: 400, statusText: 'Bad Request' },
    );

    expect(saved).toBe(true);
  });
});
