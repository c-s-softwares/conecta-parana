export interface LoginForm {
  email: string;
  password: string;
  rememberMe: boolean;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  token: string;
}