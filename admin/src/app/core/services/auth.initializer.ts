import { inject, provideAppInitializer } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { decodeJwt } from '../../shared/utils/jwt';
import { AuthService } from './auth.service';

/**
 * @description
 * Restaura a sessão anterior: havendo token salvo e decodificável, consulta
 * /auth/me para repor o usuário atual. 
 * 
 * Token corrompido/malformado ou /auth/me falhando resultam em logout('expired').
 */
export function restoreSession(auth: AuthService): Promise<unknown> {
  if (!auth.hasStoredToken()) {
    return Promise.resolve();
  }
  if (!decodeJwt(auth.getAccessToken())) {
    auth.logout('expired');
    return Promise.resolve();
  }
  return firstValueFrom(
    auth.loadCurrentUser().pipe(
      catchError(() => {
        auth.logout('expired');
        return of(null);
      }),
    ),
  );
}

/**
 * @description
 * Executa restoreSession uma vez na inicialização da aplicação, antes de
 * qualquer guard avaliar as rotas.
 */
export const provideAuthInitializer = () =>
  provideAppInitializer(() => restoreSession(inject(AuthService)));
