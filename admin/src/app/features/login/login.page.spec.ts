import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { of, throwError } from 'rxjs';

import { LoginPage } from './login.page';
import { AuthService } from '../../core/services/auth.service';
import { AuthError, AuthUser } from '../../core/services/auth.model';

const EMAIL = 'test@test.com';
const PASSWORD = '12345678';

const makeUser = (over: Partial<AuthUser> = {}): AuthUser => ({
  id: 'usr_1',
  name: 'Admin',
  email: EMAIL,
  role: 'ADMIN',
  cityId: null,
  cityName: null,
  ...over,
});

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let component: LoginPage;
  let el: HTMLElement;
  let authService: AuthService;

  beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [LoginPage, RouterModule.forRoot([])],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    authService = TestBed.inject(AuthService);
    el = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const fillForm = (rememberMe = false) =>
    component['form'].patchValue({ email: EMAIL, password: PASSWORD, rememberMe });

  it('deve criar o componente e renderizar o formulário', () => {
    expect(component).toBeTruthy();
    expect(el.querySelector('.login-shell')).toBeTruthy();
  });

  it('deve exibir o link "Esqueci a senha" apontando para /esqueci-senha', () => {
    const link = el.querySelector('a[href="/esqueci-senha"]');
    expect(link?.textContent?.trim()).toBe('Esqueci a senha');
  });

  it('togglePassword alterna o type do campo senha', () => {
    const pwd = el.querySelector('#password') as HTMLInputElement;
    expect(pwd.type).toBe('password');

    component.togglePassword();
    fixture.detectChanges();
    expect(pwd.type).toBe('text');
  });

  describe('emailError', () => {
    it('exige preenchimento, formato e sufixo de domínio', () => {
      const ctrl = component['form'].controls.email;
      ctrl.markAsTouched();

      ctrl.setValue('');
      expect(component.emailError).toBe('E-mail é obrigatório.');

      ctrl.setValue('email-invalido');
      expect(component.emailError).toBe('E-mail inválido.');

      ctrl.setValue('sem@dominio');
      expect(component.emailError).toBe('E-mail inválido.');

      ctrl.setValue('valido@email.com');
      expect(component.emailError).toBe('');
    });
  });

  describe('passwordError', () => {
    it('exige preenchimento e mínimo de 8 caracteres', () => {
      const ctrl = component['form'].controls.password;

      ctrl.setValue('');
      expect(component.passwordError).toBe('Senha é obrigatória.');

      ctrl.setValue('123');
      expect(component.passwordError).toBe('Senha deve ter ao menos 8 caracteres.');

      ctrl.setValue('12345678');
      expect(component.passwordError).toBe('');
    });
  });

  describe('onSubmit', () => {
    it('não chama auth.login quando o formulário é inválido', () => {
      const spy = vi.spyOn(authService, 'login');
      component.onSubmit();

      expect(component['form'].controls.email.touched).toBe(true);
      expect(spy).not.toHaveBeenCalled();
    });

    it('redireciona para /dashboard sem returnUrl', () => {
      vi.spyOn(authService, 'login').mockReturnValue(of(makeUser()));
      const navSpy = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

      fillForm(true);
      component.onSubmit();

      expect(authService.login).toHaveBeenCalledWith(EMAIL, PASSWORD, true);
      expect(navSpy).toHaveBeenCalledWith('/dashboard');
    });

    it('redireciona para o returnUrl preservado', () => {
      vi.spyOn(authService, 'login').mockReturnValue(of(makeUser()));
      const route = TestBed.inject(ActivatedRoute);
      vi.spyOn(route.snapshot.queryParamMap, 'get').mockReturnValue('/eventos');
      const navSpy = vi.spyOn(TestBed.inject(Router), 'navigateByUrl').mockResolvedValue(true);

      fillForm();
      component.onSubmit();

      expect(navSpy).toHaveBeenCalledWith('/eventos');
    });

    it('mapeia invalid_credentials para mensagem amigável', () => {
      vi.spyOn(authService, 'login').mockReturnValue(throwError(() => new AuthError('invalid_credentials')));

      fillForm();
      component.onSubmit();

      expect(component['errorMessage']()).toBe('Email ou senha inválidos.');
    });

    it('mapeia forbidden_role para acesso restrito', () => {
      vi.spyOn(authService, 'login').mockReturnValue(throwError(() => new AuthError('forbidden_role')));

      fillForm();
      component.onSubmit();

      expect(component['errorMessage']()).toBe('Acesso restrito a administradores.');
    });
  });
});
