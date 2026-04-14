import { inject, provideAppInitializer } from '@angular/core';
import { firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { AuthService } from './auth.service';

/**
 * @description
 * Executa uma vez na inicialização da aplicação. Se houver um token salvo de uma sessão anterior,
 * consulta /auth/me para restaurar o usuário atual antes de qualquer guard avaliar as rotas.
 * Em caso de falha, os tokens são removidos via logout('expired').
 */
export const provideAuthInitializer = () =>
  provideAppInitializer(() => {
    const auth = inject(AuthService);
    if (!auth.hasStoredToken()) {
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
  });
