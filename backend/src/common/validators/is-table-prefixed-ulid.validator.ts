import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { TablePrefix } from '../utils/ulid.util';

export const INVALID_ID_FORMAT = 'Formato de id inválido';

@ValidatorConstraint({ name: 'isTablePrefixedUlid', async: false })
export class IsTablePrefixedUlidConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    if (value === undefined || value === null || value === '') return true;
    if (typeof value !== 'string') return false;

    const prefix = args.constraints[0] as TablePrefix;

    if (!value.startsWith(prefix)) return false;

    if (value.length !== 30) return false;

    const ulidPart = value.slice(4);
    const ulidRegex = /^[0123456789ABCDEFGHJKMNPQRSTVWXYZ]{26}$/i;

    return ulidRegex.test(ulidPart);
  }

  defaultMessage() {
    return INVALID_ID_FORMAT;
  }
}

export function IsTablePrefixedUlid(
  prefix: TablePrefix,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [prefix],
      validator: IsTablePrefixedUlidConstraint,
    });
  };
}
