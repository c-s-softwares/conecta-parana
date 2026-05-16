import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import {
  CITY_SCOPE_KEY,
  CityScopeGuard,
  CityScopeOptions,
} from '../guards/city-scope.guard';

/**
 * Aplica o CityScopeGuard ao endpoint e registra de onde o guard deve ler o
 * cityId do recurso alvo.
 *
 * Exemplo:
 *  @RequireCityScope()                          -> lê body.cityId
 *  @RequireCityScope({ source: 'params' })      -> lê params.cityId
 *  @RequireCityScope({ field: 'targetCity' })   -> lê body.targetCity
 */
export function RequireCityScope(
  options: CityScopeOptions = {},
): ReturnType<typeof applyDecorators> {
  return applyDecorators(
    SetMetadata(CITY_SCOPE_KEY, options),
    UseGuards(CityScopeGuard),
  );
}
