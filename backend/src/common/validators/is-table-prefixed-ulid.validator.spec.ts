import { Validator } from 'class-validator';
import { IsTablePrefixedUlid } from './is-table-prefixed-ulid.validator';

class MockDto {
  @IsTablePrefixedUlid('usr_')
  userId!: string;
}

describe('IsTablePrefixedUlid', () => {
  const validator = new Validator();

  it('should pass for a valid prefixed ULID', () => {
    const dto = new MockDto();
    dto.userId = 'usr_01HZX3Y4Q9F8TAB1C2DKEYH9MN';

    const errors = validator.validateSync(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail and return invalid_id_format if prefix is wrong', () => {
    const dto = new MockDto();
    dto.userId = 'cit_01HZX3Y4Q9F8TAB1C2DKEYH9MN';

    const errors = validator.validateSync(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints?.isTablePrefixedUlid).toBe(
      'invalid_id_format',
    );
  });

  it('should fail if length is invalid', () => {
    const dto = new MockDto();
    dto.userId = 'usr_01HZX3Y4Q9F8TAB1C2DKEYH9M';

    const errors = validator.validateSync(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints?.isTablePrefixedUlid).toBe(
      'invalid_id_format',
    );
  });

  it('should fail if ULID contains invalid Base32 characters', () => {
    const dto = new MockDto();
    dto.userId = 'usr_01HZX3Y4Q9F8TAB1C2DKEOI9MN';

    const errors = validator.validateSync(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].constraints?.isTablePrefixedUlid).toBe(
      'invalid_id_format',
    );
  });
});
