/**
 * Contrato abstrato para o serviço de armazenamento de arquivos.
 *
 * Existem dois drivers concretos:
 * - {@link OciStorageService} - Oracle Object Storage (staging/prod).
 * - {@link LocalStorageService} - disco local em `backend/.local-uploads/` (dev).
 *
 * O driver ativo é escolhido pela env `STORAGE_DRIVER` (`local` | `oci`) e
 * resolvido via factory provider no {@link StorageModule}. Quem injeta
 * `StorageService` recebe a implementação correta para o ambiente sem
 * conhecer qual driver está em uso.
 */
export abstract class StorageService {
  /**
   * Faz upload de um objeto e retorna a URL pública (ou servível) do
   * arquivo. O `key` é o caminho lógico (ex: `photos/event/evt_x/pho_y.webp`)
   * - no driver OCI vira o object name, no driver local vira o path no disco.
   */
  abstract upload(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string>;

  /**
   * Remove um objeto. Implementações devem ser idempotentes: se o arquivo
   * já não existir, completar sem erro.
   */
  abstract delete(key: string): Promise<void>;

  /**
   * Gera uma URL temporária com TTL. No driver OCI emite um PAR
   * (Pre-Authenticated Request); no driver local apenas devolve a mesma
   * URL pública (não há autenticação local).
   */
  abstract getSignedUrl(key: string, ttlSeconds: number): Promise<string>;
}
