import { ApiProperty } from '@nestjs/swagger';

export class SuggestionResponseDto {
  @ApiProperty({ example: 'sgt_01HZX3Y4Q9F8TAB1C2DKEYH9MN' })
  id!: string;

  @ApiProperty({ example: 'Praça nova' })
  subject!: string;

  @ApiProperty({ example: 'Seria ótimo ter uma praça no Jardim Aclimação' })
  message!: string;

  @ApiProperty({
    example: 'enviada',
    description: 'Status: enviada, lida, respondida, arquivada',
  })
  status!: string;

  @ApiProperty({ example: 'usr_01HZX3Y4Q9F8TAB1C2DKEYH9MN' })
  userId!: string;

  @ApiProperty({ example: 'cit_PAIC' })
  cityId!: string;

  @ApiProperty({
    example: 'Obrigado, vamos avaliar.',
    required: false,
    nullable: true,
  })
  response?: string | null;

  @ApiProperty({
    example: '2026-05-09T13:30:00Z',
    required: false,
    nullable: true,
  })
  respondedAt?: Date | null;

  @ApiProperty({ example: 'usr_admin123', required: false, nullable: true })
  respondedById?: string | null;
}
