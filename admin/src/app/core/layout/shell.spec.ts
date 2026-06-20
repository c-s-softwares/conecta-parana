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

  it('deve ter 5 navItems com labels, rotas e ícones corretos', () => {
    const items = component['navItems'];
    expect(items).toHaveLength(5);

    const expectedLabels = ['Eventos', 'Notícias', 'Locais', 'Notificações', 'Administradores'];
    expect(items.map((i) => i.label)).toEqual(expectedLabels);

    for (const item of items) {
      expect(item.route).toMatch(/^\//);
      expect(item.icon).toBeTruthy();
    }
  });

  it('deve renderizar 5 links na sidebar', () => {
    expect(el.querySelectorAll('app-sidebar a').length).toBe(5);
  });

  it('onLogout deve chamar AuthService.logout com motivo manual', () => {
    vi.spyOn(auth, 'isSuperAdmin').mockReturnValue(false);
    fixture.detectChanges();

    const spy = vi.spyOn(auth, 'logout').mockImplementation(() => undefined);

    component.onLogout();

    expect(spy).toHaveBeenCalledWith('manual');
  });
});
