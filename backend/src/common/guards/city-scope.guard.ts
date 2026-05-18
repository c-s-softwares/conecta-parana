import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { Role } from '@prisma/client';
import { JwtPayload } from '../../modules/auth/strategies/jwt.strategy';
import { API_ERROR_CODE, apiError } from '../errors/api-error';

// Chave de metadata e tipos vivem aqui (não no decorator) para o import ser
// numa única direção: decorator -> guard. Evita dependência circular.
export const CITY_SCOPE_KEY = 'city_scope';

export type CityScopeSource = 'body' | 'params' | 'query';

export type CityScopeOptions = {
  // De onde extrair o cityId do recurso alvo (default: 'body').
  source?: CityScopeSource;
  // Nome do campo que carrega o cityId       (default: 'cityId').
  field?: string;
};

@Injectable()
export class CityScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<
      CityScopeOptions | undefined
    >(CITY_SCOPE_KEY, [context.getHandler(), context.getClass()]);

    // Sem @RequireCityScope() no endpoint -> guard não se aplica.
    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const user = request['user'] as JwtPayload | undefined;

    if (!user?.role) {
      throw new UnauthorizedException(apiError(API_ERROR_CODE.UNAUTHENTICATED));
    }

    if (user.role !== Role.ADMIN) {
      return true;
    }

    const source = options.source ?? 'body';
    const field = options.field ?? 'cityId';

    const containers: Record<CityScopeSource, unknown> = {
      body: request.body,
      params: request.params,
      query: request.query,
    };

    const container = containers[source] as Record<string, unknown> | undefined;
    const rawTarget = container?.[field];
    const targetCityId = typeof rawTarget === 'string' ? rawTarget : undefined;

    // Super Admin: ADMIN sem cityId no JWT - atua em qualquer cidade, mas precisa dizer qual no payload.
    if (user.cityId === null || user.cityId === undefined) {
      if (!targetCityId) {
        throw new BadRequestException(apiError(API_ERROR_CODE.CITY_REQUIRED));
      }
      return true;
    }

    // ADMIN municipal: só pode atuar na própria cidade.
    if (targetCityId && targetCityId !== user.cityId) {
      throw new ForbiddenException(apiError(API_ERROR_CODE.CITY_SCOPE_DENIED));
    }

    // cityId alvo ausente ou igual ao próprio -> implicitamente própria cidade.
    return true;
  }
}
