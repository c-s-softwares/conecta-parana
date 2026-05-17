import { Module } from '@nestjs/common';
import { LoggerModule, Params } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { IncomingMessage, ServerResponse } from 'http';

export function genReqId(req: IncomingMessage, res?: ServerResponse): string {
  const existingId = req.headers['x-request-id'];
  let reqId: string;

  if (typeof existingId === 'string' && existingId) {
    reqId = existingId;
  } else {
    reqId = randomUUID();
  }

  if (res && !res.headersSent) {
    res.setHeader('x-request-id', reqId);
  }

  return reqId;
}

function envPinoOptions(env: string | undefined): Record<string, unknown> {
  switch (env) {
    case 'development':
      return {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            singleLine: true,
            translateTime: 'SYS:HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        },
        level: 'debug',
      };
    case 'test':
      // Silencia o ruído de request logs durante os testes e2e.
      return { level: 'silent' };
    default:
      return { level: 'info' };
  }
}

export function pinoLoggerFactory(config: ConfigService): Params {
  return {
    pinoHttp: {
      genReqId,
      autoLogging: true,
      ...envPinoOptions(config.get<string>('NODE_ENV')),
    },
  };
}

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: pinoLoggerFactory,
    }),
  ],
})
export class PinoLoggerModule {}
