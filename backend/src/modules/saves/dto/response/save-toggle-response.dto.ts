import { ApiProperty } from '@nestjs/swagger';

export class SaveToggleResponseDto {
  @ApiProperty({
    example: true,
    description:
      'Indica se o recurso foi salvo (true) ou removido dos salvos (false)',
  })
  saved!: boolean;
}
