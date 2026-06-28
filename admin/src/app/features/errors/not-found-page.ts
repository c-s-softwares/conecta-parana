import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorPage } from './error-page';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [ErrorPage, RouterLink],
  template: `
    <app-error-page
      code="404"
      subtitle="Página não encontrada"
      errorTitle="Não encontramos esta página"
      description="O endereço digitado não existe ou foi movido. Verifique o link ou volte ao início do painel para continuar."
      iconName="heroMagnifyingGlass"
      theme="neutral"
    >
      <a routerLink="/dashboard" class="btn btn-primary">Voltar ao dashboard</a>
    </app-error-page>
  `,
})
export class NotFoundPage {}
