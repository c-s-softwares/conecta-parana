import { of, throwError } from 'rxjs';

import { restoreSession } from './auth.initializer';
import { AuthService } from './auth.service';

function makeJwt(payload: unknown): string {
  const b64 = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sig`;
}

const validToken = makeJwt({ sub: 'usr_1', role: 'ADMIN', cityId: null });

function mockAuth(overrides: Record<string, unknown>): AuthService {
  return {
    hasStoredToken: vi.fn(() => false),
    getAccessToken: vi.fn(() => null),
    loadCurrentUser: vi.fn(() => of({})),
    logout: vi.fn(),
    ...overrides,
  } as unknown as AuthService;
}

describe('restoreSession', () => {
  it('não faz nada quando não há token salvo', async () => {
    const auth = mockAuth({ hasStoredToken: vi.fn(() => false) });
    await restoreSession(auth);
    expect(auth.loadCurrentUser).not.toHaveBeenCalled();
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('limpa via logout(expired) quando o token está corrompido', async () => {
    const auth = mockAuth({
      hasStoredToken: vi.fn(() => true),
      getAccessToken: vi.fn(() => 'token-corrompido'),
    });

    await restoreSession(auth);

    expect(auth.logout).toHaveBeenCalledWith('expired');
    expect(auth.loadCurrentUser).not.toHaveBeenCalled();
  });

  it('consulta /auth/me quando o token é decodificável', async () => {
    const auth = mockAuth({
      hasStoredToken: vi.fn(() => true),
      getAccessToken: vi.fn(() => validToken),
      loadCurrentUser: vi.fn(() => of({ id: 'usr_1' })),
    });

    await restoreSession(auth);

    expect(auth.loadCurrentUser).toHaveBeenCalled();
    expect(auth.logout).not.toHaveBeenCalled();
  });

  it('faz logout(expired) quando /auth/me falha', async () => {
    const auth = mockAuth({
      hasStoredToken: vi.fn(() => true),
      getAccessToken: vi.fn(() => validToken),
      loadCurrentUser: vi.fn(() => throwError(() => new Error('401'))),
    });

    await restoreSession(auth);

    expect(auth.logout).toHaveBeenCalledWith('expired');
  });
});
