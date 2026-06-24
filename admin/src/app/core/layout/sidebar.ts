import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon } from '@ng-icons/core';

export interface NavItem {
  label: string;
  route: string;
  /** Nome do ícone @ng-icons/heroicons (ex.: 'heroCalendarDays'). */
  icon: string;
  /** Se true, o item só é renderizado para Super Admins. Padrão: false. */
  requiresSuperAdmin?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIcon],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  items = input.required<NavItem[]>();
  logout = output<void>();
}
