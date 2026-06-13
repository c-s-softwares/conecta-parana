export const MIN_PASSWORD_LENGTH = 8;

export const STRONG_PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export const STRONG_PASSWORD_MESSAGE =
  'A senha deve ter no mínimo 8 caracteres, incluindo pelo menos 1 letra e 1 número';

export function isStrongPassword(password: string): boolean {
  return (
    password.length >= MIN_PASSWORD_LENGTH &&
    STRONG_PASSWORD_REGEX.test(password)
  );
}
