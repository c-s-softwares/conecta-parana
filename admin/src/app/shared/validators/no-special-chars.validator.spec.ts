import { FormControl } from '@angular/forms';
import { noSpecialChars } from './no-special-chars.validator';

describe('noSpecialChars', () => {
  const validator = noSpecialChars();
  const specialChars = ['/', ';', '[', ']', '.', ',', '*', '&', '%', '$', '#', '@', '!', '^', '`', '{', '+', "'", '"', '\\'];

  it('deve retornar null para texto sem caracteres especiais', () => {
    expect(validator(new FormControl('texto normal 123'))).toBeNull();
  });

  it('deve retornar null para valor vazio', () => {
    expect(validator(new FormControl(''))).toBeNull();
  });

  it('deve retornar null para valor null', () => {
    expect(validator(new FormControl(null))).toBeNull();
  });

  it.each(specialChars)('deve rejeitar o caractere especial: %s', (char) => {
    expect(validator(new FormControl(`teste${char}texto`))).toEqual({ specialChars: true });
  });

  it.each(['Título com acentuação', 'titulo-com-hifen', 'titulo com espaço'])(
    'deve aceitar texto válido: %s',
    (text) => {
      expect(validator(new FormControl(text))).toBeNull();
    },
  );
});
