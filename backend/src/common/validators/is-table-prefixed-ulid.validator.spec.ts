import { Validator } from 'class-validator';
import {
  IsTablePrefixedUlid,
  INVALID_ID_FORMAT,
} from './is-table-prefixed-ulid.validator';
import { TABLE_PREFIX } from '../types/ulid.types';

const VALID_USER_ID = `${TABLE_PREFIX.USER}01HZX3Y4Q9F8TAB1C2DKEYH9MN`;
const VALID_CITY_ID = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH9MN`;
const INVALID_LENGTH_ID = `${TABLE_PREFIX.USER}01HZX3Y4Q9F8TAB1C2DKEYH9M`;
const INVALID_CHARS_ID = `${TABLE_PREFIX.USER}01HZX3Y4Q9F8TAB1C2DKEOI9MN`;

class MockDto {
  @IsTablePrefixedUlid(TABLE_PREFIX.USER)
  userId!: string;
}

describe('IsTablePrefixedUlid', () => {
  const validator = new Validator();

  it('should pass for a valid prefixed ULID', () => {
    const dto = new MockDto();
    dto.userId = VALID_USER_ID;

    const errors = validator.validateSync(dto);
    expect(errors.length).toBe(0);
  });

  it(`should fail and return ${INVALID_ID_FORMAT} if prefix is wrong`, () => {
    const dto = new MockDto();
    dto.userId = VALID_CITY_ID;

    const errors = validator.validateSync(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints?.isTablePrefixedUlid).toBe(INVALID_ID_FORMAT);
  });

  it('should fail if length is invalid', () => {
    const dto = new MockDto();
    dto.userId = INVALID_LENGTH_ID;

    const errors = validator.validateSync(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints?.isTablePrefixedUlid).toBe(INVALID_ID_FORMAT);
  });

  it('should fail if ULID contains invalid Base32 characters', () => {
    const dto = new MockDto();
    dto.userId = INVALID_CHARS_ID;

    const errors = validator.validateSync(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints?.isTablePrefixedUlid).toBe(INVALID_ID_FORMAT);
  });
});
