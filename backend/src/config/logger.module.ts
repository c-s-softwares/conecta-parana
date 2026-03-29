import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { IncomingMessage } from 'http';

@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const isDev = config.get<string>('NODE_ENV') === 'development';

        return {
          pinoHttp: {
            genReqId: (req: IncomingMessage) => {
              const existingId = req.headers['x-request-id'];
              if (typeof existingId === 'string' && existingId) {
                return existingId;
              }
              return randomUUID();
            },
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
      },
    }),
  ],
})
export class PinoLoggerModule {}
