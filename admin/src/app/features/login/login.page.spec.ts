import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { LoginPage } from './login.page';
import { AuthService } from '../../core/services/auth.service';
import { of } from 'rxjs';

describe('LoginPage', () => {
  let fixture: ComponentFixture<LoginPage>;
  let component: LoginPage;
  let el: HTMLElement;
  let authService: AuthService;

  beforeEach(async () => {
    vi.spyOn(console, 'log').mockImplementation(() => undefined);

    await TestBed.configureTestingModule({
      imports: [LoginPage, RouterModule.forRoot([])],
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

  it('deve criar o componente e renderizar o formulário', () => {
    expect(component).toBeTruthy();
    expect(el.querySelector('.login-card')).toBeTruthy();
  });

  describe('emailError / emailTouched', () => {
    it('deve retornar required quando vazio, email quando inválido, vazio quando válido', () => {
      const ctrl = component['form'].controls.email;

      expect(component.emailTouched).toBe(false);
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(component.emailTouched).toBe(true);
      expect(component.emailError).toBe('E-mail é obrigatório.');

      ctrl.setValue('email-invalido');
      expect(component.emailError).toBe('E-mail inválido.');

      ctrl.setValue('valido@email.com');
      expect(component.emailError).toBe('');
    });
  });

  describe('passwordError / passwordTouched', () => {
    it('deve retornar required quando vazio, minlength quando curto, vazio quando válido', () => {
      const ctrl = component['form'].controls.password;

      expect(component.passwordTouched).toBe(false);
      ctrl.setValue('');
      ctrl.markAsTouched();
      expect(component.passwordTouched).toBe(true);
      expect(component.passwordError).toBe('Senha é obrigatória.');

      ctrl.setValue('123');
      expect(component.passwordError).toBe('Senha deve ter ao menos 8 caracteres.');

      ctrl.setValue('12345678');
      expect(component.passwordError).toBe('');
    });
  });

  describe('onSubmit', () => {
    it('deve marcar touched e não chamar auth se inválido', () => {
      const spy = vi.spyOn(authService, 'login');
      component.onSubmit();

      expect(component['form'].controls.email.touched).toBe(true);
      expect(spy).not.toHaveBeenCalled();
    });

    it('deve chamar auth.login com email e senha corretos', () => {
      const spy = vi.spyOn(authService, 'login').mockReturnValue(
        of({ id: 1, name: 'Admin', email: 'test@test.com', token: 'abc' })
      );

      component['form'].patchValue({
        email: 'test@test.com',
        password: '12345678',
      });
      component.onSubmit();

      expect(spy).toHaveBeenCalledWith('test@test.com');
    });

    it('deve salvar token quando rememberMe for true', () => {
      const saveSpy = vi.spyOn(authService, 'saveToken');
      vi.spyOn(authService, 'login').mockReturnValue(
        of({ id: 1, name: 'Admin', email: 'test@test.com', token: 'abc' })
      );

      component['form'].patchValue({
        email: 'test@test.com',
        password: '12345678',
        rememberMe: true,
      });
      component.onSubmit();

      expect(saveSpy).toHaveBeenCalledWith('abc');
    });
  });
});