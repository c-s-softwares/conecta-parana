import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ForgotPasswordPage } from './forgot-password.page';
import { AuthService } from '../../core/services/auth.service';
import { AuthError } from '../../core/services/auth.model';

const EMAIL = 'ana@cidade.pr.gov.br';
const CODE = '123456';

describe('ForgotPasswordPage', () => {
  const auth = {
    forgotPassword: vi.fn(),
    verifyResetCode: vi.fn(),
    resetPassword: vi.fn(),
  };

  let fixture: ComponentFixture<ForgotPasswordPage>;
  let component: ForgotPasswordPage;
  let el: HTMLElement;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    auth.forgotPassword.mockReturnValue(of(undefined));
    auth.verifyResetCode.mockReturnValue(of(undefined));
    auth.resetPassword.mockReturnValue(of(undefined));

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordPage, RouterModule.forRoot([])],
      providers: [{ provide: AuthService, useValue: auth }],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordPage);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
  });

  afterEach(() => {
    fixture.destroy();
    vi.restoreAllMocks();
  });

  const fillCode = (code: string) => component['codeDigits'].set(code.split(''));

  it('renderiza e percorre os 3 passos + sucesso', () => {
    fixture.detectChanges();
    expect(el.querySelector('.step-dots')).toBeTruthy();
    expect(el.querySelector('#fp-email')).toBeTruthy();

    component['emailControl'].setValue(EMAIL);
    component.submitEmail();
    fixture.detectChanges();
    expect(el.querySelectorAll('.code-cell')).toHaveLength(6);
    expect(el.textContent).toContain('expira em');

    component['email'].set(EMAIL);
    fillCode(CODE);
    component.submitCode();
    fixture.detectChanges();
    expect(el.querySelector('#fp-new')).toBeTruthy();
    expect(el.querySelectorAll('.pwd-req')).toHaveLength(3);

    component['passwordForm'].setValue({ newPassword: 'NovaSenha1', confirmPassword: 'NovaSenha1' });
    component.submitPassword();
    fixture.detectChanges();
    expect(el.querySelector('.success-icon')).toBeTruthy();
    expect(el.textContent).toContain('Senha redefinida');
  });

  it('passo 1: e-mail inválido não chama forgotPassword', () => {
    component['emailControl'].setValue('invalido');
    component.submitEmail();
    expect(auth.forgotPassword).not.toHaveBeenCalled();
  });

  it('passo 1 -> 2: e-mail válido avança e inicia o timer', () => {
    component['emailControl'].setValue(EMAIL);
    component.submitEmail();

    expect(auth.forgotPassword).toHaveBeenCalledWith(EMAIL);
    expect(component['step']()).toBe(2);
    expect(component['remainingMs']()).toBeGreaterThan(0);
  });

  it('passo 1: too_many_attempts vira mensagem inline', () => {
    auth.forgotPassword.mockReturnValue(throwError(() => new AuthError('too_many_attempts')));
    component['emailControl'].setValue(EMAIL);
    component.submitEmail();
    expect(component['step']()).toBe(1);
    expect(component['errorMessage']()).toContain('Muitas tentativas');
  });

  it('passo 2: código incompleto não chama verifyResetCode', () => {
    fillCode('123');
    component.submitCode();
    expect(auth.verifyResetCode).not.toHaveBeenCalled();
  });

  it('passo 2 -> 3: código completo verifica e avança', () => {
    component['email'].set(EMAIL);
    fillCode(CODE);
    component.submitCode();

    expect(auth.verifyResetCode).toHaveBeenCalledWith(EMAIL, CODE);
    expect(component['step']()).toBe(3);
  });

  it('passo 3 -> done: senha válida redefine', () => {
    component['email'].set(EMAIL);
    fillCode(CODE);
    component['passwordForm'].setValue({ newPassword: 'NovaSenha1', confirmPassword: 'NovaSenha1' });
    component.submitPassword();

    expect(auth.resetPassword).toHaveBeenCalledWith(EMAIL, CODE, 'NovaSenha1');
    expect(component['step']()).toBe('done');
  });

  it('passo 3: senhas diferentes não chamam resetPassword', () => {
    component['passwordForm'].setValue({ newPassword: 'NovaSenha1', confirmPassword: 'Outra1234' });
    component.submitPassword();
    expect(auth.resetPassword).not.toHaveBeenCalled();
  });

  it('código inválido no reset volta para o passo 2 com mensagem', () => {
    auth.resetPassword.mockReturnValue(throwError(() => new AuthError('invalid_or_expired_code')));
    component['email'].set(EMAIL);
    fillCode(CODE);
    component['step'].set(3);
    component['passwordForm'].setValue({ newPassword: 'NovaSenha1', confirmPassword: 'NovaSenha1' });

    component.submitPassword();

    expect(component['step']()).toBe(2);
    expect(component['errorMessage']()).toContain('Código inválido');
  });

  it('checklist de senha reflete os requisitos reais do backend', () => {
    component['passwordForm'].controls.newPassword.setValue('abcdefg1');
    expect(component['reqMinLength']()).toBe(true);
    expect(component['reqLetter']()).toBe(true);
    expect(component['reqNumber']()).toBe(true);
    expect(component['passwordScore']()).toBe(3);
  });

  it('reenviar reinicia o timer e informa o usuário', () => {
    component['email'].set(EMAIL);
    component.resendCode();
    expect(auth.forgotPassword).toHaveBeenCalledWith(EMAIL);
    expect(component['resendInfo']()).toBeTruthy();
  });

  it('onCodeInput preenche o dígito e onCodePaste distribui', () => {
    const input = document.createElement('input');
    input.value = '7';
    component.onCodeInput(2, { target: input } as unknown as Event);
    expect(component['codeDigits']()[2]).toBe('7');

    const paste = {
      clipboardData: { getData: () => '123456' },
      preventDefault: vi.fn(),
    } as unknown as ClipboardEvent;
    component.onCodePaste(paste);
    expect(component['code']()).toBe(CODE);
  });

  it('back navega entre os passos e togglePassword alterna', () => {
    component['step'].set(3);
    component.back();
    expect(component['step']()).toBe(2);
    component.back();
    expect(component['step']()).toBe(1);

    expect(component['showPassword']()).toBe(false);
    component.togglePassword();
    expect(component['showPassword']()).toBe(true);
  });
});
