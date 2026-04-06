import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavItem, Sidebar } from './sidebar';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './shell.html',
})
export class Shell {
  protected readonly navItems: NavItem[] = [
    { label: 'Postagens', route: '/posts', icon: 'pencil-square' },
    { label: 'Eventos', route: '/events', icon: 'calendar-days' },
    { label: 'Notícias', route: '/news', icon: 'newspaper' },
    { label: 'Locais', route: '/locals', icon: 'map-pin' },
    { label: 'Notificações', route: '/notifications', icon: 'bell' },

    // TODO: a tela de criar adm so aparecerá para SuperAdmins / AdminGeral
    { label: 'Administradores', route: '/superadmin', icon: 'pencil-square' },
  ];

  onLogout(): void {
    console.log('Logout');
  }
}