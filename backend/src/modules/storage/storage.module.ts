import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalStorageService } from './local-storage.service';
import { OciStorageService } from './oci-storage.service';
import { StorageService } from './storage.service';

/**
 * Disponibiliza o {@link StorageService} apropriado para o ambiente:
 *
 * - `STORAGE_DRIVER=local` (padrão em dev) → {@link LocalStorageService}:
 *   arquivos vão para `backend/.local-uploads/`, servidos por
 *   `app.useStaticAssets(...)` em `main.ts` no prefixo `/dev-uploads`.
 * - `STORAGE_DRIVER=oci` (padrão em staging/prod) → {@link OciStorageService}:
 *   integração real com Oracle Cloud Object Storage.
 *
 * Ambos os concretos são instanciados via DI (são baratos), e a factory
 * abaixo decide qual deles atende o token público `StorageService`. Quem
 * injeta `StorageService` não conhece nem precisa conhecer o driver.
 */
@Module({
  providers: [
    OciStorageService,
    LocalStorageService,
    {
      provide: StorageService,
      useFactory: (
        config: ConfigService,
        oci: OciStorageService,
        local: LocalStorageService,
      ): StorageService =>
        config.get<string>('STORAGE_DRIVER') === 'oci' ? oci : local,
      inject: [ConfigService, OciStorageService, LocalStorageService],
    },
  ],
  exports: [StorageService],
})
export class StorageModule {}
