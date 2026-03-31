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

export function pinoLoggerFactory(config: ConfigService): Params {
  const isDev = config.get<string>('NODE_ENV') === 'development';

  return {
    pinoHttp: {
      genReqId,
      autoLogging: true,
      ...(isDev
        ? {
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
          }
        : {
            level: 'info',
          }),
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
