import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function noSpecialChars(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const hasSpecial = /[/;[\].,*&%$#@!^`{+'"\\]/.test(control.value);
    return hasSpecial ? { specialChars: true } : null;
  };
}
