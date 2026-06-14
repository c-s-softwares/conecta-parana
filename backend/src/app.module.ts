import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './config/prisma.module';
import { RedisCacheModule } from './config/redis-cache.module';
import { envValidationSchema } from './config/env.validation';
import { ThrottlerModule } from '@nestjs/throttler';
import { CustomThrottlerGuard } from './common/guards/throttler.guard';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { AuthModule } from './modules/auth/auth.module';
import { AdminModule } from './modules/admin/admin.module';
import { CitiesModule } from './modules/cities/cities.module';
import { LocalsModule } from './modules/locals/locals.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { SuggestionsModule } from './modules/suggestions/suggestions.module';
import { TicketsModule } from './modules/tickets/tickets.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { LikesModule } from './modules/likes/likes.module';
import { SavesModule } from './modules/saves/saves.module';
import { HttpCacheInterceptor } from './common/interceptors/http-cache.interceptor';
import { PinoLoggerModule } from './config/logger.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: true,
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('THROTTLE_TTL') ?? 60000,
          limit: config.get<number>('THROTTLE_LIMIT') ?? 100,
        },
      ],
    }),
    PinoLoggerModule,
    PrismaModule,
    AuthModule,
    AdminModule,
    CitiesModule,
    LocalsModule,
    NotificationsModule,
    SuggestionsModule,
    TicketsModule,
    UploadsModule,
    LikesModule,
    SavesModule,
    RedisCacheModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpCacheInterceptor,
    },
  ],
})
export class AppModule {}
