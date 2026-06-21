import {
  extractDateFromUlid,
  extractTimestampFromUlid,
  formatUlidAsMonthYear,
} from './ulid';

const KNOWN_TIMESTAMP_MS = 1699997385344;
const KNOWN_ULID = '01HF7VV0M0';
const PREFIXED_ID = `cty_${KNOWN_ULID}ABCDEFGHIJKLMNOP`;
const PLAIN_ULID = `${KNOWN_ULID}ABCDEFGHIJKLMNOP`;

describe('ulid utils', () => {
  describe('extractTimestampFromUlid', () => {
    it('deve extrair timestamp de ULID com prefixo', () => {
      expect(extractTimestampFromUlid(PREFIXED_ID)).toBe(KNOWN_TIMESTAMP_MS);
    });

    it('deve extrair timestamp de ULID sem prefixo', () => {
      expect(extractTimestampFromUlid(PLAIN_ULID)).toBe(KNOWN_TIMESTAMP_MS);
    });

    it('deve retornar null para string com menos de 10 chars de tempo', () => {
      expect(extractTimestampFromUlid('cty_short')).toBeNull();
    });

    it('deve retornar null para char fora de Crockford Base32', () => {
      expect(extractTimestampFromUlid('cty_!@#$%^&*()ABCDEFGHIJKLMNOP')).toBeNull();
    });
  });

  describe('extractDateFromUlid', () => {
    it('deve retornar Date correspondente ao timestamp', () => {
      const date = extractDateFromUlid(PREFIXED_ID);
      expect(date).toEqual(new Date(KNOWN_TIMESTAMP_MS));
    });

    it('deve retornar null quando timestamp inválido', () => {
      expect(extractDateFromUlid('inválido')).toBeNull();
    });
  });

  describe('formatUlidAsMonthYear', () => {
    it('deve formatar como "mmm/yyyy" em pt-BR', () => {
      const expectedDate = new Date(KNOWN_TIMESTAMP_MS);
      const months = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
      const expected = `${months[expectedDate.getMonth()]}/${expectedDate.getFullYear()}`;
      expect(formatUlidAsMonthYear(PREFIXED_ID)).toBe(expected);
    });

    it('deve retornar "—" para ID inválido', () => {
      expect(formatUlidAsMonthYear('xx')).toBe('—');
    });
  });
});
