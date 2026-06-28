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
      pill="Roteador ** → /404"
    >
      <a routerLink="/dashboard" class="btn btn-primary">
        <span>›</span> Voltar ao início
      </a>
      <a routerLink="/dashboard" class="btn btn-ghost">Voltar para o painel</a>
    </app-error-page>
  `,
})
export class NotFoundPage {}
