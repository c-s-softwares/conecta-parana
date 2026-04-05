import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';

  login(email: string, password: string): Observable<AuthUser> {
    console.log('[AuthService] login:', email);
    return of({ id: 1, name: 'Admin', email, token: 'mock-token-123' });
  }

  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}