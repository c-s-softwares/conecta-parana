import { NestExpressApplication } from '@nestjs/platform-express';
import * as Sentry from '@sentry/node';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import type { ServerResponse } from 'http';
import { AppModule } from './app.module';
import { ForbiddenException, ValidationPipe } from '@nestjs/common';
import { SentryExceptionFilter } from './common/sentry-exception.filter';
import { JsonParseExceptionFilter } from './common/filters/json-parse-exception.filter';
import { MulterExceptionFilter } from './common/filters/multer-exception.filter';
import { validationPipeConfig } from './config/validation-pipe.config';
import { getLocalStorageDir } from './modules/storage/local-storage.service';

const glitchtipDsn = process.env.GLITCHTIP_DSN;
if (glitchtipDsn) {
  Sentry.init({
    dsn: glitchtipDsn,
    environment: process.env.NODE_ENV || 'development',
    // GlitchTip não suporta tracing - manter desabilitado
    tracesSampleRate: 0,
  });
}

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.useLogger(app.get(Logger));

  app.use(helmet());

  const configService = app.get(ConfigService);
  const allowedOrigins =
    configService
      .get<string>('CORS_ORIGIN')
      ?.split(',')
      .map((origin) => origin.trim()) ?? [];

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(
          new ForbiddenException(`Origin ${origin} not allowed by CORS`),
          false,
        );
      }
    },
  });

  // Filters globais:
  // - JsonParseExceptionFilter: transforma BadRequest do body-parser em { code, message }.
  // - MulterExceptionFilter: transforma erros do multer (LIMIT_FILE_SIZE etc) em { code, message }.
  // - SentryExceptionFilter: captura 5xx e crashes inesperados no GlitchTip.
  // Mais específicos primeiro - o Nest aplica o mais específico para o tipo da exceção.
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(
    new SentryExceptionFilter(httpAdapter),
    new JsonParseExceptionFilter(),
    new MulterExceptionFilter(),
  );

  app.useGlobalPipes(new ValidationPipe(validationPipeConfig));

  // Serve arquivos do driver `local` do StorageService em /dev-uploads/...
  // Em modo `oci` o diretório não existe (ou fica vazio) e o handler só
  // responde 404 para qualquer URL - sem impacto pratico em prod, pois as
  // URLs geradas lá apontam para o bucket Oracle.
  app.useStaticAssets(getLocalStorageDir(), {
    prefix: '/dev-uploads',
    setHeaders: (res: ServerResponse) => {
      res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    },
  });

  if (configService.get<string>('NODE_ENV') !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Conecta Paraná API')
      .setDescription('API do sistema Conecta Paraná')
      .setVersion('0.1.0')
      .addBearerAuth()
      .build();

    const document = SwaggerModule.createDocument(app, config, {
      deepScanRoutes: true,
    });
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);
}

void bootstrap();
