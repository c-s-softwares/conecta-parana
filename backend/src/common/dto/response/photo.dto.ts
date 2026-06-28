import { ApiProperty } from '@nestjs/swagger';

/**
 * Foto em formato leve para listagens: somente a miniatura (thumbUrl).
 * Evita carregar a imagem cheia em respostas de coleção.
 */
export class PhotoThumbDto {
  @ApiProperty({ example: 'pho_01HZX3Y4Q9F8TAB1C2DKEYH9MN' })
  id!: string;

  @ApiProperty({
    example:
      'https://objectstorage.sa-saopaulo-1.oraclecloud.com/.../pho_y-thumb.webp',
    nullable: true,
  })
  thumbUrl!: string | null;
}

/**
 * Foto completa para respostas de detalhe: imagem cheia (url) + miniatura.
 */
export class PhotoSummaryDto extends PhotoThumbDto {
  @ApiProperty({
    example:
      'https://objectstorage.sa-saopaulo-1.oraclecloud.com/.../pho_y.webp',
  })
  url!: string;
}
