export interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export type UserRole = 'ADMIN' | 'USUARIO';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
}

export type AuthErrorKind =
  | 'invalid_credentials'
  | 'server_unreachable'
  | 'forbidden_role'
  | 'unknown';

export class AuthError extends Error {
  constructor(public readonly kind: AuthErrorKind) {
    super(kind);
  }
}
