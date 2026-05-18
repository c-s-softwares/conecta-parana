import { decodeJwt } from './jwt';

function makeJwt(payload: unknown): string {
  const b64 = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.sig`;
}

describe('decodeJwt', () => {
  it('extrai sub, role e cityId de um token válido', () => {
    const token = makeJwt({
      sub: 'usr_1',
      email: 'a@b.com',
      role: 'ADMIN',
      cityId: 'cit_maringa',
      exp: 123,
    });

    expect(decodeJwt(token)).toEqual({
      sub: 'usr_1',
      email: 'a@b.com',
      role: 'ADMIN',
      cityId: 'cit_maringa',
      exp: 123,
    });
  });

  it('normaliza cityId ausente para null (Super Admin)', () => {
    const token = makeJwt({ sub: 'usr_super', role: 'ADMIN' });
    expect(decodeJwt(token)?.cityId).toBeNull();
  });

  it('retorna null para token nulo ou indefinido', () => {
    expect(decodeJwt(null)).toBeNull();
    expect(decodeJwt(undefined)).toBeNull();
    expect(decodeJwt('')).toBeNull();
  });

  it('retorna null quando não tem 3 partes', () => {
    expect(decodeJwt('abc')).toBeNull();
    expect(decodeJwt('abc.def')).toBeNull();
  });

  it('retorna null para payload base64/JSON corrompido', () => {
    expect(decodeJwt('aaa.@@@.bbb')).toBeNull();
  });

  it('retorna null quando sub ou role estão ausentes', () => {
    expect(decodeJwt(makeJwt({ role: 'ADMIN' }))).toBeNull();
    expect(decodeJwt(makeJwt({ sub: 'usr_1' }))).toBeNull();
  });
});
