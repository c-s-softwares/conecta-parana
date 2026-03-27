import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { createKeyv } from '@keyv/redis';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const redisUrl = configService.get<string>(
          'REDIS_URL',
          'redis://localhost:6379',
        );

        return {
          stores: [createKeyv(redisUrl)],
          ttl: 30_000, // TTL padrão: 30 segundos (em ms)
        };
      },
    }),
  ],
  exports: [CacheModule],
})
export class RedisCacheModule {}
