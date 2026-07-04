import { ApiProperty } from '@nestjs/swagger';

/**
 * Autor de um conteúdo (notícia, comunicado, evento) embutido na resposta.
 * Evita um GET de usuário separado no mobile.
 */
export class UserSummaryDto {
  @ApiProperty({ example: 'usr_01HZX3Y4Q9F8TAB1C2DKEYH9MN' })
  id!: string;

  @ApiProperty({ example: 'Admin Maringá' })
  name!: string;
}
