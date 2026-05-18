import { JwtClaims } from '../../core/services/auth.model';

/**
 * Decodifica o payload de um JWT (sem validar a assinatura) para extrair
 * sub/role/cityId. Uso apenas para roteamento e UI condicional.
 * 
 * Retorna `null` para qualquer token ausente, malformado ou corrompido.
 */
export function decodeJwt(token: string | null | undefined): JwtClaims | null {
  if (!token) return null;

  const parts = token.split('.');

  if (parts.length !== 3) return null;

  try {
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');

    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );

    const claims = JSON.parse(json) as Partial<JwtClaims>;

    if (typeof claims.sub !== 'string' || typeof claims.role !== 'string') {
      return null;
    }

    return {
      sub: claims.sub,
      email: claims.email ?? '',
      role: claims.role,
      cityId: claims.cityId ?? null,
      exp: claims.exp,
    };
  } catch {
    return null;
  }
}
