import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { Shell } from './shell';

describe('Shell', () => {
  let fixture: ComponentFixture<Shell>;
  let component: Shell;
  let el: HTMLElement;

  beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [Shell, RouterModule.forRoot([])],
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

  it('deve ter 5 navItems com labels, rotas e ícones corretos', () => {
    const items = component['navItems'];
    expect(items).toHaveLength(5);

    const expectedLabels = ['Postagens', 'Eventos', 'Notícias', 'Locais', 'Notificações'];
    expect(items.map((i) => i.label)).toEqual(expectedLabels);

    for (const item of items) {
      expect(item.route).toMatch(/^\//);
      expect(item.icon).toBeTruthy();
    }
  });

  it('deve renderizar 5 links na sidebar', () => {
    expect(el.querySelectorAll('app-sidebar a').length).toBe(5);
  });

  it('onLogout deve logar no console', () => {
    component.onLogout();
    expect(console.log).toHaveBeenCalledWith('Logout');
  });
});
