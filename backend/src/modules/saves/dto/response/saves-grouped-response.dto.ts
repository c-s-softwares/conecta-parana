import { ApiProperty } from '@nestjs/swagger';

export class SavesGroupedResponseDto {
  @ApiProperty({
    type: 'array',
    items: { type: 'object' },
    description: 'Lista de eventos salvos pelo cidadão',
  })
  events!: any[];

  @ApiProperty({
    type: 'array',
    items: { type: 'object' },
    description: 'Lista de comunicados salvos pelo cidadão',
  })
  communicates!: any[];

  @ApiProperty({
    type: 'array',
    items: { type: 'object' },
    description: 'Lista de notícias salvas pelo cidadão',
  })
  news!: any[];

  @ApiProperty({
    type: 'array',
    items: { type: 'object' },
    description: 'Lista de locais salvos pelo cidadão',
  })
  locals!: any[];
}
