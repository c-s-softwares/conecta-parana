import { IsEmail, IsString, Matches } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailDto {
  @ApiProperty({ example: 'user@email.com' })
  @IsEmail()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  email!: string;

  @ApiProperty({
    example: '847291',
    description: 'Código de 6 dígitos recebido por email',
  })
  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'code deve ter exatamente 6 dígitos numéricos',
  })
  code!: string;
}
