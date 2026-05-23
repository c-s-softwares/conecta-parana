import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface KeyvRedisClient {
  keys(pattern: string): Promise<string[]>;
  del(keys: string[]): Promise<number>;
}

interface KeyvStoreInner {
  _client?: KeyvRedisClient;
  client?: KeyvRedisClient;
  _store?: {
    keys?(): Iterable<string>;
  };
}

interface KeyvStore {
  _store?: KeyvStoreInner;
  store?: KeyvStoreInner;
  delete(key: string): Promise<boolean>;
}

interface CacheManagerWithStores {
  stores: KeyvStore[];
}

/**
 * iknterceptor geneico que limpa automaticamente o cache de rotas GET
 * correspondentes a um recurso sempre que uma operação de escrita (POST, PUT, PATCH, DELETE) e realizada, .
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const method = request.method;
    const path = request.path;

    // Se for uma requisição de escrita (POST, PUT, PATCH, DELETE), dispara invalidação
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      return next.handle().pipe(
        tap(() => {
          void (async () => {
            // Extrai o recurso base (ex: '/cities/01HZX...' -> '/cities') para identificar
            const parts = path.split('/');
            const baseResource = parts[1] ? `/${parts[1]}` : path;

            try {
              const cacheWithStores = this
                .cacheManager as unknown as CacheManagerWithStores;
              const keyv = cacheWithStores.stores?.[0];

              if (!keyv) {
                await this.cacheManager.del(baseResource);
                return;
              }

              const keyvStore = keyv.store || keyv._store;
              const client = keyvStore?._client || keyvStore?.client;

              if (client && typeof client.keys === 'function') {
                const pattern = `*${baseResource}*`;
                const keys = await client.keys(pattern);
                if (keys && keys.length > 0) {
                  // Deleta usando o cliente nativo do Redis
                  await client.del(keys);
                }
              } else {
                const memoryMap = keyvStore?._store;

                if (memoryMap && typeof memoryMap.keys === 'function') {
                  const allKeys = Array.from(memoryMap.keys());
                  const keysToDelete = allKeys.filter(
                    (key) =>
                      key.startsWith(baseResource) ||
                      key.includes(`:${baseResource}`),
                  );
                  for (const key of keysToDelete) {
                    await keyv.delete(key);
                  }
                } else {
                  await this.cacheManager.del(baseResource);
                }
              }
            } catch (err) {
              const message = err instanceof Error ? err.message : String(err);
              console.error(
                `Erro ao invalidar cache para o recurso ${baseResource}:`,
                message,
              );
            }
          })();
        }),
      );
    }

    return next.handle();
  }
}
