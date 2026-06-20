import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Request } from 'express';
import { from, Observable } from 'rxjs';
import { concatMap, map } from 'rxjs/operators';
import { SKIP_CACHE_INVALIDATION_KEY } from '../decorators/skip-cache-invalidation.decorator';

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
 * @class HttpCacheInterceptor
 * @implements {NestInterceptor}
 *
 * @description
 * Interceptor genérico responsável pela limpeza automatizada de cache de rotas GET
 * correspondentes a um recurso sempre que uma operação de escrita (POST, PUT, PATCH, DELETE) é realizada com sucesso.
 *
 * **Funcionamento:**
 * - GET: As requisições de leitura passam direto, permitindo que a resposta seja armazenada ou retornada do cache pelo interceptor padrão do NestJS.
 * - Escrita (POST, PUT, PATCH, DELETE): O interceptor captura o recurso base do path da requisição (ex: extrai `/cities` de `/cities/123`), aguarda a execução bem-sucedida da rota e expurga todas as chaves de cache relacionadas a esse recurso.
 *
 * **Estratégias por Driver:**
 * - **Redis**: Para instâncias Redis, o interceptor obtém o cliente Redis subjacente (`_client` ou `client`) e utiliza o comando `KEYS *<baseResource>*` para varrer e excluir (via `del`) todas as chaves correspondentes ao padrão de forma atômica e eficiente.
 * - **Keyv em Memória**: Para armazenamentos locais em memória (Keyv padrão), acessa-se o Map interno (`_store`) e utiliza-se o método `keys()` para listar e filtrar as chaves iniciadas ou contendo o recurso base, removendo-as manualmente via `delete`.
 * - **Fallback**: Caso não consiga detectar ou acessar estruturas internas do driver específico, o interceptor tenta um fallback simplificado utilizando o método `del` padrão do Cache Manager na chave exata do recurso base.
 *
 * @important
 * **Aviso de Manutenção:** Este interceptor depende de propriedades privadas e internas dos drivers de cache (`_client`, `_store`, `stores[0]`)
 *  que não fazem parte da API pública ou tipada do `@nestjs/cache-manager` e `cache-manager`.
 *  Atualizações futuras dessas dependências ou de pacotes relacionados podem quebrar a lógica de invalidação de cache de forma silenciosa.
 * É crucial que qualquer atualização nessas dependências seja acompanhada de testes rigorosos neste interceptor (especialmente testes de E2E de invalidação de cache).
 */
@Injectable()
export class HttpCacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(HttpCacheInterceptor.name);

  constructor(
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const http = context.switchToHttp();
    const request = http.getRequest<Request>();
    const method = request.method;
    const path = request.path;

    const skipInvalidation = this.reflector.getAllAndOverride<boolean>(
      SKIP_CACHE_INVALIDATION_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Se for uma requisição de escrita (POST, PUT, PATCH, DELETE) e não pular invalidação, dispara invalidação
    // ANTES de propagar a resposta para o cliente. Garante consistência:
    // o GET imediatamente posterior não pega cache stale.
    if (
      ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) &&
      !skipInvalidation
    ) {
      return next
        .handle()
        .pipe(
          concatMap((value: unknown) =>
            from(this.invalidateCache(path)).pipe(map(() => value)),
          ),
        );
    }

    return next.handle();
  }

  /**
   * Invalida todas as chaves de cache associadas ao recurso base do path
   * (ex: `/cities/123` invalida tudo que case com o padrão de cidades).
   *
   * Falhas de cache NÃO derrubam o request: o erro é logado e o fluxo
   * continua (write já foi commitado, cache fica stale até TTL).
   */
  private async invalidateCache(path: string): Promise<void> {
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
        return;
      }

      const memoryMap = keyvStore?._store;

      if (memoryMap && typeof memoryMap.keys === 'function') {
        const allKeys = Array.from(memoryMap.keys());
        const keysToDelete = allKeys.filter(
          (key) =>
            key.startsWith(baseResource) || key.includes(`:${baseResource}`),
        );
        for (const key of keysToDelete) {
          await keyv.delete(key);
        }
        return;
      }

      await this.cacheManager.del(baseResource);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(
        `Erro ao invalidar cache para o recurso ${baseResource}: ${message}`,
      );
    }
  }
}
