import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { RouterModule } from '@angular/router';

import { Shell } from './shell';
import { AuthService } from '../services/auth.service';
import { AuthUser } from '../services/auth.model';
import { ConnectivityService } from '../services/connectivity.service';

const municipalUser: AuthUser = {
  id: 'usr_1',
  name: 'Ana Lima',
  email: 'ana@conecta.local',
  role: 'ADMIN',
  cityId: 'cit_maringa',
  cityName: 'Maringá',
};

const superUser: AuthUser = {
  id: 'usr_2',
  name: 'Bia Souza',
  email: 'bia@conecta.local',
  role: 'ADMIN',
  cityId: null,
  cityName: null,
};

describe('Shell', () => {
  const isSuper = signal(false);
  const currentUser = signal<AuthUser | null>(null);
  const logout = vi.fn();
  const isOnline = signal(true);

  let component: Shell;

  beforeEach(async () => {
    isSuper.set(false);
    currentUser.set(null);
    logout.mockClear();
    isOnline.set(true);

    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [Shell, RouterModule.forRoot([])],
      providers: [
        { provide: AuthService, useValue: { isSuperAdmin: isSuper, currentUser, logout } },
        { provide: ConnectivityService, useValue: { isOnline } },
      ],
    }).compileComponents();

    component = TestBed.createComponent(Shell).componentInstance;
  });

  afterEach(() => vi.restoreAllMocks());

  it('mostra os 5 itens do ADMIN municipal', () => {
    currentUser.set(municipalUser);
    expect(component['visibleNavItems']().map((i) => i.route)).toEqual([
      '/dashboard',
      '/eventos',
      '/comunicados',
      '/noticias',
      '/sugestoes',
    ]);
  });

  it('mostra os 3 itens do Super Admin', () => {
    isSuper.set(true);
    currentUser.set(superUser);
    expect(component['visibleNavItems']().map((i) => i.route)).toEqual([
      '/dashboard',
      '/cidades',
      '/administradores',
    ]);
  });

  it('sidebarUser é nulo sem usuário e traz cidade + iniciais para municipal', () => {
    expect(component['sidebarUser']()).toBeNull();

    currentUser.set(municipalUser);
    expect(component['sidebarUser']()).toEqual({
      name: 'Ana Lima',
      roleLabel: 'Admin · Maringá',
      initials: 'AL',
    });
  });

  it('roleLabel do Super Admin é "Super Admin"', () => {
    isSuper.set(true);
    currentUser.set(superUser);
    expect(component['sidebarUser']()?.roleLabel).toBe('Super Admin');
  });

  it('onLogout chama auth.logout("manual")', () => {
    component.onLogout();
    expect(logout).toHaveBeenCalledWith('manual');
  });

  it('renderiza a sidebar: skeleton sem usuário, depois nome + cidade e botão Sair', () => {
    const fixture = TestBed.createComponent(Shell);
    const el: HTMLElement = fixture.nativeElement;

    fixture.detectChanges();
    expect(el.querySelector('app-sidebar .skeleton')).toBeTruthy();
    expect(el.querySelector('router-outlet')).toBeTruthy();

    currentUser.set(municipalUser);
    fixture.detectChanges();
    expect(el.querySelector('.user-name')?.textContent?.trim()).toBe('Ana Lima');
    expect(el.querySelector('.user-role')?.textContent?.trim()).toBe('Admin · Maringá');
    expect(el.querySelectorAll('app-sidebar .nav-item').length).toBeGreaterThan(0);

    el.querySelector<HTMLButtonElement>('.sidebar-footer button')?.click();
    expect(logout).toHaveBeenCalledWith('manual');
  });

  it('mostra banner offline quando isOnline é false', () => {
    const fixture = TestBed.createComponent(Shell);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.offline-banner')).toBeNull();

    isOnline.set(false);
    fixture.detectChanges();
    const banner = fixture.nativeElement.querySelector('.offline-banner');
    expect(banner).toBeTruthy();
    expect(banner.textContent).toContain('Sem conexão com o servidor');
  });

  it('esconde banner offline quando isOnline volta a true', () => {
    const fixture = TestBed.createComponent(Shell);
    isOnline.set(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.offline-banner')).toBeTruthy();

    isOnline.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.offline-banner')).toBeNull();
  });
});

