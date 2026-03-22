import * as Sentry from '@sentry/node';
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
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
  const app = await NestFactory.create(AppModule);

  // Filter global de exceções enviadas para o GlitchTip
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryExceptionFilter(httpAdapter));

  const config = new DocumentBuilder()
    .setTitle('Conecta Paraná API')
    .setDescription('API do sistema Conecta Paraná')
    .setVersion('0.1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}

void bootstrap();
