import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModule, CacheModuleOptions } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): CacheModuleOptions => {
        const driver = configService.get<string>('CACHE_DRIVER', 'redis');
        const logger = new Logger('CacheModule');

        if (driver === 'memory') {
          logger.warn(
            'CACHE_DRIVER=memory - usando cache em memória (apenas dev local). Sem Redis, dados não persistem entre reinícios e não são compartilhados entre instâncias.',
          );
          return { ttl: 30_000 };
        }

        const redisUrl = configService.get<string>(
          'REDIS_URL',
          'redis://localhost:6379',
        );
        logger.log(`CACHE_DRIVER=redis - conectando em ${redisUrl}`);
        return {
          stores: [createKeyv(redisUrl)],
          ttl: 30_000,
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
