import { Component, computed, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon } from '@ng-icons/core';

export interface NavItem {
  label: string;
  route: string;
  /** Nome do icone @ng-icons/heroicons (ex.: 'heroCalendarDays'). */
  icon: string;
  section: 'manage' | 'super';
}

export interface SidebarUser {
  name: string;
  roleLabel: string;
  initials: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIcon],
  templateUrl: './sidebar.html',
})
export class Sidebar {
  items = input.required<NavItem[]>();
  user = input<SidebarUser | null>(null);
  logout = output<void>();

  protected readonly manageItems = computed(() =>
    this.items().filter((item) => item.section === 'manage'),
  );
  protected readonly superItems = computed(() =>
    this.items().filter((item) => item.section === 'super'),
  );
}
