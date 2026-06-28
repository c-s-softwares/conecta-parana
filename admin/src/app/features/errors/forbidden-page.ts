import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorPage } from './error-page';

@Component({
  selector: 'app-forbidden-page',
  standalone: true,
  imports: [ErrorPage, RouterLink],
  template: `
    <app-error-page
      code="403"
      subtitle="Acesso negado"
      errorTitle="Você não tem acesso a esta área"
      description="A página que você tentou acessar é restrita. Seu papel atual não permite acessá-la. Volte ao seu painel para continuar."
      iconName="heroLockClosed"
      theme="amber"
    >
      <a routerLink="/dashboard" class="btn btn-primary">Voltar ao dashboard</a>
    </app-error-page>
  `,
})
export class ForbiddenPage {}
