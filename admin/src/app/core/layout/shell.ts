import { Component, computed, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavItem, Sidebar, SidebarUser } from './sidebar';
import { AuthService } from '../services/auth.service';

type NavDef = NavItem & { scope: 'all' | 'municipal' | 'super' };

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, Sidebar],
  templateUrl: './shell.html',
})
export class Shell {
  private readonly auth = inject(AuthService);

  private readonly navDefs: NavDef[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'heroSquares2x2', section: 'manage', scope: 'all' },
    { label: 'Eventos', route: '/eventos', icon: 'heroCalendarDays', section: 'manage', scope: 'municipal' },
    { label: 'Comunicados', route: '/comunicados', icon: 'heroMegaphone', section: 'manage', scope: 'municipal' },
    { label: 'Notícias', route: '/noticias', icon: 'heroNewspaper', section: 'manage', scope: 'municipal' },
    { label: 'Sugestões', route: '/sugestoes', icon: 'heroChatBubbleLeftRight', section: 'manage', scope: 'municipal' },
    { label: 'Cidades', route: '/cidades', icon: 'heroBuildingOffice2', section: 'super', scope: 'super' },
    { label: 'Administradores', route: '/administradores', icon: 'heroShieldCheck', section: 'super', scope: 'super' },
  ];

  protected readonly visibleNavItems = computed<NavItem[]>(() => {
    const isSuper = this.auth.isSuperAdmin();
    return this.navDefs.filter((item) => {
      if (item.scope === 'all') return true;
      return item.scope === 'super' ? isSuper : !isSuper;
    });
  });

  protected readonly sidebarUser = computed<SidebarUser | null>(() => {
    const user = this.auth.currentUser();
    if (!user) return null;
    const roleLabel = this.auth.isSuperAdmin()
      ? 'Super Admin'
      : user.cityName
        ? `Admin · ${user.cityName}`
        : 'Admin';
    return { name: user.name, roleLabel, initials: this.initialsOf(user.name) };
  });

  onLogout(): void {
    this.auth.logout('manual');
  }

  private initialsOf(name: string): string {
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.charAt(0) ?? '';
    const last = parts.length > 1 ? parts[parts.length - 1].charAt(0) : '';
    return (first + last).toUpperCase();
  }
}
