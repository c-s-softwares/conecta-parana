import { TestBed } from '@angular/core/testing';
import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Subject, of, throwError } from 'rxjs';

import { AppError } from './app-error';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';
import { ERROR_CODE_MAP, errorInterceptor } from './error.interceptor';

const URL = '/api/teste';

const STATUS = {
  UNAUTHORIZED:   { status: 401, statusText: 'Unauthorized' },
  BAD_REQUEST:    { status: 400, statusText: 'Bad Request' },
  FORBIDDEN:      { status: 403, statusText: 'Forbidden' },
  NOT_FOUND:      { status: 404, statusText: 'Not Found' },
  TOO_MANY:       { status: 429, statusText: 'Too Many Requests' },
  SERVER_ERROR:   { status: 500, statusText: 'Internal Server Error' },
} as const;

const MSG = {
  SESSION_EXPIRED: 'Sessão expirada, faça login novamente.',
  ACCESS_DENIED:   'Acesso negado.',
  SERVER_ERROR:    'Erro do servidor. Tente novamente em instantes.',
  NO_CONNECTION:   'Sem conexão com o servidor.',
} as const;

// ---------------------------------------------------------------------------

describe('errorInterceptor', () => {
  let http: HttpClient;
  let controller: HttpTestingController;

  const authMock = { refresh: vi.fn(), logout: vi.fn(), getAccessToken: vi.fn() };
  const toastMock = { show: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([errorInterceptor])),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authMock },
        { provide: ToastService, useValue: toastMock },
      ],
    });

    http = TestBed.inject(HttpClient);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => controller.verify());

  // 401 -> refresh ok -> requisição refeita com novo token
  it('401: faz refresh e refaz a requisição com o novo token', () => {
    authMock.refresh.mockReturnValue(of('new-token'));

    let result: unknown;
    http.get(URL).subscribe({ next: (r) => (result = r) });

    controller.expectOne(URL).flush({}, STATUS.UNAUTHORIZED);

    const retried = controller.expectOne(URL);
    expect(retried.request.headers.get('Authorization')).toBe('Bearer new-token');
    retried.flush({ ok: true });

    expect(result).toEqual({ ok: true });
    expect(authMock.refresh).toHaveBeenCalledTimes(1);
    expect(toastMock.show).not.toHaveBeenCalled();
  });

  // 401 -> refresh falha -> logout + toast "Sessão expirada"
  it('401: quando refresh falha, chama logout e exibe toast de sessão expirada', () => {
    authMock.refresh.mockReturnValue(throwError(() => ({ status: 401, error: {} })));
    authMock.logout.mockImplementation(() => undefined);

    let caughtError: unknown;
    http.get(URL).subscribe({ error: (e) => (caughtError = e) });

    controller.expectOne(URL).flush({}, STATUS.UNAUTHORIZED);

    expect(caughtError).toBeDefined();
    expect(authMock.logout).toHaveBeenCalledWith('expired');
    expect(toastMock.show).toHaveBeenCalledWith('error', MSG.SESSION_EXPIRED);
  });

  // 401 paralelos -> apenas 1 refresh (serialização via BehaviorSubject)
  // Usa Subject para que o refresh não complete sincronamente, permitindo que
  // todas as requests se enfileirem antes do resultado chegar.
  it('401: serializa paralelas - apenas 1 refresh para 5 requests simultâneos', () => {
    const refreshSubject = new Subject<string>();
    authMock.refresh.mockReturnValue(refreshSubject.asObservable());

    const results: unknown[] = [];
    for (let i = 0; i < 5; i++) {
      http.get(`${URL}?i=${i}`).subscribe({ next: (r) => results.push(r) });
    }

    const initial = controller.match((r) => r.url.startsWith(URL));
    expect(initial.length).toBe(5);
    initial.forEach((r) => r.flush({}, STATUS.UNAUTHORIZED));

    expect(authMock.refresh).toHaveBeenCalledTimes(1);

    refreshSubject.next('serial-token');
    refreshSubject.complete();

    const retried = controller.match((r) => r.url.startsWith(URL));
    expect(retried.length).toBe(5);
    retried.forEach((r) => {
      expect(r.request.headers.get('Authorization')).toBe('Bearer serial-token');
      r.flush({ ok: true });
    });

    expect(results.length).toBe(5);
  });

  // 403 -> toast "Acesso negado" + AppError
  it('403: exibe toast de acesso negado e repassa AppError ao componente', () => {
    let err: AppError | undefined;
    http.get(URL).subscribe({ error: (e) => (err = e) });

    controller.expectOne(URL).flush({ message: 'Forbidden' }, STATUS.FORBIDDEN);

    expect(err?.status).toBe(403);
    expect(err?.message).toBe(MSG.ACCESS_DENIED);
    expect(toastMock.show).toHaveBeenCalledWith('error', MSG.ACCESS_DENIED);
  });

  // 400 sem code -> passthrough silencioso (fallback PASSTHROUGH_STATUSES)
  it('400 sem code: não exibe toast e repassa AppError com details', () => {
    const body = { message: ['name must not be empty'], error: 'Bad Request' };
    let err: AppError | undefined;
    http.get(URL).subscribe({ error: (e) => (err = e) });

    controller.expectOne(URL).flush(body, STATUS.BAD_REQUEST);

    expect(err?.status).toBe(400);
    expect(err?.details).toEqual(body);
    expect(toastMock.show).not.toHaveBeenCalled();
  });

  // 400 + code "validation_failed" -> passthrough por ERROR_CODE_MAP (false)
  it('validation_failed: não exibe toast e repassa AppError com details', () => {
    const body = {
      code: 'validation_failed',
      message: ['name must not be empty', 'email must be an email'],
    };
    let err: AppError | undefined;
    http.get(URL).subscribe({ error: (e) => (err = e) });

    controller.expectOne(URL).flush(body, STATUS.BAD_REQUEST);

    expect(err?.status).toBe(400);
    expect(err?.details).toEqual(body);
    expect(toastMock.show).not.toHaveBeenCalled();
  });

  // 429 + code "too_many_attempts" -> toast com mensagem do backend
  it('too_many_attempts: exibe toast com a mensagem vinda do backend', () => {
    const backendMessage = 'Muitas tentativas de login. Aguarde 15 minutos.';
    let err: AppError | undefined;
    http.get(URL).subscribe({ error: (e) => (err = e) });

    controller.expectOne(URL).flush(
      { code: 'too_many_attempts', message: backendMessage },
      STATUS.TOO_MANY,
    );

    expect(err?.status).toBe(429);
    expect(toastMock.show).toHaveBeenCalledWith('error', backendMessage);
  });

  // 404 -> passthrough silencioso
  it('404: não exibe toast e repassa AppError com details', () => {
    const body = { message: 'Not Found' };
    let err: AppError | undefined;
    http.get(URL).subscribe({ error: (e) => (err = e) });

    controller.expectOne(URL).flush(body, STATUS.NOT_FOUND);

    expect(err?.status).toBe(404);
    expect(err?.details).toEqual(body);
    expect(toastMock.show).not.toHaveBeenCalled();
  });

  // 429 sem code -> toast com mensagem do backend (fallback STATUS_MAP null)
  it('429 sem code: exibe toast com a mensagem vinda do backend', () => {
    const backendMessage = 'Muitas tentativas de login. Aguarde 15 minutos.';
    http.get(URL).subscribe({ error: () => undefined });

    controller
      .expectOne(URL)
      .flush({ message: backendMessage }, STATUS.TOO_MANY);

    expect(toastMock.show).toHaveBeenCalledWith('error', backendMessage);
  });

  // 5xx -> toast genérico de erro de servidor
  it('500: exibe toast de erro do servidor', () => {
    let err: AppError | undefined;
    http.get(URL).subscribe({ error: (e) => (err = e) });

    controller.expectOne(URL).flush({}, STATUS.SERVER_ERROR);

    expect(err?.status).toBe(500);
    expect(err?.message).toBe(MSG.SERVER_ERROR);
    expect(toastMock.show).toHaveBeenCalledWith('error', MSG.SERVER_ERROR);
  });

  // Status 0 (falha de rede) -> toast com action "Tentar novamente"
  it('status 0: exibe toast de rede com action "Tentar novamente"', () => {
    let err: AppError | undefined;
    http.get(URL).subscribe({ error: (e) => (err = e) });

    controller.expectOne(URL).error(new ProgressEvent('error'));

    expect(err?.status).toBe(0);
    expect(err?.message).toBe(MSG.NO_CONNECTION);
    expect(toastMock.show).toHaveBeenCalledWith(
      'error',
      MSG.NO_CONNECTION,
      expect.objectContaining({ label: 'Tentar novamente' }),
    );
  });

  // code field com string -> ERROR_CODE_MAP tem prioridade sobre STATUS_MAP
  it('code field com string: usa mensagem do ERROR_CODE_MAP antes do status', () => {
    ERROR_CODE_MAP['test_code'] = 'Mensagem mapeada por code.';

    let err: AppError | undefined;
    http.get(URL).subscribe({ error: (e) => (err = e) });

    controller.expectOne(URL).flush(
      { code: 'test_code', message: 'Mensagem original do backend.' },
      STATUS.FORBIDDEN,
    );

    expect(err?.message).toBe('Mensagem mapeada por code.');
    expect(toastMock.show).toHaveBeenCalledWith('error', 'Mensagem mapeada por code.');

    delete ERROR_CODE_MAP['test_code'];
  });

  // Rotas skip (/auth/login, /auth/refresh) -> erro propagado sem tratamento
  it('não trata erros em /auth/login - propaga HttpErrorResponse original', () => {
    let caughtError: unknown;
    http.post('/auth/login', {}).subscribe({ error: (e) => (caughtError = e) });

    controller
      .expectOne('/auth/login')
      .flush({ message: 'Credenciais inválidas' }, STATUS.UNAUTHORIZED);

    expect(toastMock.show).not.toHaveBeenCalled();
    expect(authMock.refresh).not.toHaveBeenCalled();
    expect(caughtError).toBeDefined();
  });
});
