import { SetMetadata } from '@nestjs/common';

export const SKIP_CACHE_INVALIDATION_KEY = 'skipCacheInvalidation';

/**
 * Decorator para pular a invalidação automática de cache na rota ou classe.
 */
export const SkipCacheInvalidation = () =>
  SetMetadata(SKIP_CACHE_INVALIDATION_KEY, true);
