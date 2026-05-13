import { ulid } from 'ulid';
import { TABLE_PREFIX } from '../types/ulid.types';

export type TablePrefix = (typeof TABLE_PREFIX)[keyof typeof TABLE_PREFIX];

/**
 * Essa função gera um ULID com prefixo.
 * 30 caracteres no total (4 chars prefix + 26 chars ULID).
 * @param prefix
 * @returns
 **/
export function generateId(prefix: TablePrefix): string {
  return `${prefix}${ulid()}`;
}
