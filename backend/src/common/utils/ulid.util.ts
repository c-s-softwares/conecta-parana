import { ulid } from 'ulid';
import { TablePrefix } from '../types/ulid.types';

/**
 * Essa função gera um ULID com prefixo.
 * 30 caracteres no total (4 chars prefix + 26 chars ULID).
 * @param prefix
 * @returns
 **/
export function generateId(prefix: TablePrefix): string {
  return `${prefix}${ulid()}`;
}
