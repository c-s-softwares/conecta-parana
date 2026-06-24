import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterModule } from '@angular/router';
import { Shell } from './shell';
import { AuthService } from '../services/auth.service';

const REGULAR_ADMIN_LABELS = ['Eventos', 'Notícias', 'Locais', 'Notificações'];
const SUPER_ADMIN_LABELS = [
  'Eventos',
  'Notícias',
  'Locais',
  'Cidades',
  'Notificações',
  'Administradores',
];

describe('Shell', () => {
  let fixture: ComponentFixture<Shell>;
  let component: Shell;
  let el: HTMLElement;
  let auth: AuthService;

  beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [Shell, RouterModule.forRoot([])],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Shell);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    auth = TestBed.inject(AuthService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve criar o componente e renderizar sidebar + router-outlet', () => {
    vi.spyOn(auth, 'isSuperAdmin').mockReturnValue(false);
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(el.querySelector('app-sidebar')).toBeTruthy();
    expect(el.querySelector('router-outlet')).toBeTruthy();
  });

  it('deve manter os 6 navItems declarados (fonte da verdade)', () => {
    const items = component['navItems'];
    expect(items).toHaveLength(6);
    expect(items.map((i) => i.label)).toEqual(SUPER_ADMIN_LABELS);

    for (const item of items) {
      expect(item.route).toMatch(/^\//);
      expect(item.icon).toBeTruthy();
    }
  });

  it('admin regular não vê itens de Super Admin (Cidades, Administradores)', () => {
    vi.spyOn(auth, 'isSuperAdmin').mockReturnValue(false);
    fixture.detectChanges();

    const visible = component['visibleNavItems']();
    expect(visible.map((i) => i.label)).toEqual(REGULAR_ADMIN_LABELS);
    expect(el.querySelectorAll('app-sidebar a').length).toBe(
      REGULAR_ADMIN_LABELS.length,
    );
  });

  it('Super Admin vê todos os itens', () => {
    vi.spyOn(auth, 'isSuperAdmin').mockReturnValue(true);
    fixture.detectChanges();

    const visible = component['visibleNavItems']();
    expect(visible.map((i) => i.label)).toEqual(SUPER_ADMIN_LABELS);
    expect(el.querySelectorAll('app-sidebar a').length).toBe(
      SUPER_ADMIN_LABELS.length,
    );
  });

  it('onLogout deve chamar AuthService.logout com motivo manual', () => {
    vi.spyOn(auth, 'isSuperAdmin').mockReturnValue(false);
    fixture.detectChanges();

    const spy = vi.spyOn(auth, 'logout').mockImplementation(() => undefined);

    component.onLogout();

    expect(spy).toHaveBeenCalledWith('manual');
  });
});
