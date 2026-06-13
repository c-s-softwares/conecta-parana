import { INestApplication, ValidationPipe } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { TestingModule } from '@nestjs/testing';
import { App } from 'supertest/types';
import { Logger as PinoLogger } from 'nestjs-pino';
import { SentryExceptionFilter } from '../../src/common/sentry-exception.filter';
import { JsonParseExceptionFilter } from '../../src/common/filters/json-parse-exception.filter';
import { validationPipeConfig } from '../../src/config/validation-pipe.config';

/**
 * Cria a aplicação NestJS para testes e2e com o MESMO pipeline da produção
 * (definido em src/main.ts). Centraliza pipes, filters e logger globais
 * para que novos e2e herdem a configuração sem replicar setup.
 *
 * Pipeline aplicado:
 * - Logger via nestjs-pino (que, com NODE_ENV=test, fica em level=silent -
 *   ver src/config/logger.module.ts). Sem isto, chamadas internas a
 *   `new Logger(...)` caem no console default e poluem a saída do CI.
 * - ValidationPipe com validationPipeConfig (whitelist, transform e
 *   exceptionFactory que produz `apiError(validation_failed)`).
 * - SentryExceptionFilter (captura 5xx para o GlitchTip).
 * - JsonParseExceptionFilter (transforma BadRequest do body-parser em
 *   `{ code: 'malformed_json', ... }`).
 *
 * NÃO aplica:
 * - helmet (irrelevante em testes).
 * - CORS (idem).
 * - Swagger (idem).
 */
export async function buildTestApp(
  moduleRef: TestingModule,
): Promise<INestApplication<App>> {
  const app = moduleRef.createNestApplication<INestApplication<App>>({
    bufferLogs: true,
  });

  app.useLogger(app.get(PinoLogger));

  app.useGlobalPipes(new ValidationPipe(validationPipeConfig));

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new SentryExceptionFilter(httpAdapter),
    new JsonParseExceptionFilter(),
  );

  await app.init();
  return app;
}
