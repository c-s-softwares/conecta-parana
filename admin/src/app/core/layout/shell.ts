import { Component, computed, inject } from '@angular/core';
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
    { label: 'Eventos', route: '/events', icon: 'heroCalendarDays' },
    { label: 'Notícias', route: '/news', icon: 'heroNewspaper' },
    { label: 'Locais', route: '/locals', icon: 'heroMapPin' },
    {
      label: 'Cidades',
      route: '/cities',
      icon: 'heroBuildingOffice2',
      requiresSuperAdmin: true,
    },
    { label: 'Notificações', route: '/notifications', icon: 'heroBell' },
    {
      label: 'Administradores',
      route: '/admins',
      icon: 'heroPencilSquare',
      requiresSuperAdmin: true,
    },
  ];

  protected readonly visibleNavItems = computed<NavItem[]>(() => {
    const isSuper = this.auth.isSuperAdmin();
    return this.navItems.filter((item) => !item.requiresSuperAdmin || isSuper);
  });

  onLogout(): void {
    this.auth.logout('manual');
  }
}
