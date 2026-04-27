import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterModule } from '@angular/router';
import { Shell } from './shell';
import { AuthService } from '../services/auth.service';

describe('Shell', () => {
  let fixture: ComponentFixture<Shell>;
  let component: Shell;
  let el: HTMLElement;

  beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [Shell, RouterModule.forRoot([])],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(Shell);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('deve criar o componente e renderizar sidebar + router-outlet', () => {
    expect(component).toBeTruthy();
    expect(el.querySelector('app-sidebar')).toBeTruthy();
    expect(el.querySelector('router-outlet')).toBeTruthy();
  });

  it('deve ter 6 navItems com labels, rotas e ícones corretos', () => {
    const items = component['navItems'];
    expect(items).toHaveLength(6);

    const expectedLabels = ['Postagens', 'Eventos', 'Notícias', 'Locais', 'Notificações', 'Administradores'];
    expect(items.map((i) => i.label)).toEqual(expectedLabels);

    for (const item of items) {
      expect(item.route).toMatch(/^\//);
      expect(item.icon).toBeTruthy();
    }
  });

  it('deve renderizar 6 links na sidebar', () => {
    expect(el.querySelectorAll('app-sidebar a').length).toBe(6);
  });

  it('onLogout deve chamar AuthService.logout com motivo manual', () => {
    const auth = TestBed.inject(AuthService);
    const spy = vi.spyOn(auth, 'logout').mockImplementation(() => undefined);

    component.onLogout();

    expect(spy).toHaveBeenCalledWith('manual');
  });
});
