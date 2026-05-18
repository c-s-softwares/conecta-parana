export interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export type UserRole = 'ADMIN' | 'CIDADAO';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  cityId: string | null;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export interface JwtClaims {
  sub: string;
  email: string;
  role: UserRole;
  cityId: string | null;
  exp?: number;
}

export type AuthErrorKind =
  | 'invalid_credentials'
  | 'too_many_attempts'
  | 'server_unreachable'
  | 'forbidden_role'
  | 'unknown';

export class AuthError extends Error {
  constructor(public readonly kind: AuthErrorKind) {
    super(kind);
  }
}
