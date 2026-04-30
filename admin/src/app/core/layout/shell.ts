import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavItem, Sidebar } from './sidebar';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './shell.html',
})
export class Shell {
  private readonly auth = inject(AuthService);

  protected readonly navItems: NavItem[] = [
    { label: 'Postagens', route: '/posts', icon: 'pencil-square' },
    { label: 'Eventos', route: '/events', icon: 'calendar-days' },
    { label: 'Notícias', route: '/news', icon: 'newspaper' },
    { label: 'Locais', route: '/locals', icon: 'map-pin' },
    { label: 'Notificações', route: '/notifications', icon: 'bell' },
  ];

  onLogout(): void {
    this.auth.logout('manual');
  }
}
