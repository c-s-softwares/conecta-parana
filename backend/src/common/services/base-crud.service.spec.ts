import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

import { PrismaService } from '../../config/prisma.service';
import { TABLE_PREFIX } from '../types/ulid.types';
import { BaseCrudService, CityScopedUser } from './base-crud.service';

const OWN_CITY_ID = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH9MN`;
const OTHER_CITY_ID = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH0PQ`;
const PAYLOAD_CITY_ID = `${TABLE_PREFIX.CITY}01HZX3Y4Q9F8TAB1C2DKEYH1RS`;

const MUNICIPAL_ADMIN: CityScopedUser = { cityId: OWN_CITY_ID };
const SUPER_ADMIN: CityScopedUser = { cityId: null };

/**
 * Subclasse concreta mínima que expõe os helpers protected para teste direto,
 * sem depender de nenhum módulo de domínio.
 */
class TestCrudService extends BaseCrudService<unknown, unknown, unknown> {
  protected getDelegate() {
    return {} as never;
  }
  protected toResponse(entity: unknown): unknown {
    return entity;
  }
  protected toCreateData(): Record<string, unknown> {
    return {};
  }
  protected toUpdateData(): Record<string, unknown> {
    return {};
  }

  callRequireUser<U>(user: U | null | undefined): U {
    return this.requireUser(user);
  }
  callResolveTenantCityId(
    payloadCityId: string | undefined,
    user: CityScopedUser,
  ): string {
    return this.resolveTenantCityId(payloadCityId, user);
  }
  callAssertTenantCityScope(entityCityId: string, user: CityScopedUser): void {
    this.assertTenantCityScope(entityCityId, user);
  }
}

describe('BaseCrudService tenant scope', () => {
  const service = new TestCrudService({} as PrismaService, {
    tablePrefix: TABLE_PREFIX.CITY,
    entityName: 'Teste',
  });

  describe('requireUser', () => {
    it('retorna o usuário quando presente', () => {
      const user = { cityId: OWN_CITY_ID };
      expect(service.callRequireUser(user)).toBe(user);
    });

    it('lança UnauthorizedException quando ausente', () => {
      expect(() => service.callRequireUser(undefined)).toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('resolveTenantCityId', () => {
    it('ADMIN municipal grava na própria cidade ignorando o payload', () => {
      expect(
        service.callResolveTenantCityId(PAYLOAD_CITY_ID, MUNICIPAL_ADMIN),
      ).toBe(OWN_CITY_ID);
    });

    it('Super Admin usa a cidade informada no payload', () => {
      expect(
        service.callResolveTenantCityId(PAYLOAD_CITY_ID, SUPER_ADMIN),
      ).toBe(PAYLOAD_CITY_ID);
    });

    it('Super Admin sem cityId no payload recebe city_required', () => {
      expect(() =>
        service.callResolveTenantCityId(undefined, SUPER_ADMIN),
      ).toThrow(BadRequestException);
    });
  });

  describe('assertTenantCityScope', () => {
    it('bloqueia ADMIN municipal em recurso de outra cidade', () => {
      expect(() =>
        service.callAssertTenantCityScope(OTHER_CITY_ID, MUNICIPAL_ADMIN),
      ).toThrow(ForbiddenException);
    });

    it('permite ADMIN municipal na própria cidade', () => {
      expect(() =>
        service.callAssertTenantCityScope(OWN_CITY_ID, MUNICIPAL_ADMIN),
      ).not.toThrow();
    });

    it('permite Super Admin em qualquer cidade', () => {
      expect(() =>
        service.callAssertTenantCityScope(OTHER_CITY_ID, SUPER_ADMIN),
      ).not.toThrow();
    });
  });
});
