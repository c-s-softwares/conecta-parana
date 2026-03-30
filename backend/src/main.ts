import { NestExpressApplication } from '@nestjs/platform-express';
import * as Sentry from '@sentry/node';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { ForbiddenException } from '@nestjs/common';
import { SentryExceptionFilter } from './common/sentry-exception.filter';

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
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

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

  // Filter global de exceções enviadas para o GlitchTip
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryExceptionFilter(httpAdapter));

  const config = new DocumentBuilder()
    .setTitle('Conecta Paraná API')
    .setDescription('API do sistema Conecta Paraná')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);
}

void bootstrap();
