import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ClubModule } from './modules/club/club.module';
import { CountryModule } from './modules/country/country.module';
import { LeagueModule } from './modules/league/league.module';
import { PlayerModule } from './modules/player/player.module';
import { SaveGameModule } from './modules/save-game/save-game.module';
import { SeedModule } from './modules/seed/seed.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: Number(config.get('THROTTLE_TTL', 60)) * 1000,
          limit: Number(config.get('THROTTLE_LIMIT', 100)),
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService): TypeOrmModuleOptions => {
        return {
          type: 'postgres' as const,
          host: config.get<string>('DB_HOST', 'localhost'),
          port: Number(config.get('DB_PORT', 5432)),
          username: config.get<string>('DB_USERNAME', 'postgres'),
          password: config.get<string>('DB_PASSWORD', 'Diorygon@2080'),
          database: config.get<string>('DB_DATABASE', 'postgres'),
          autoLoadEntities: true,
          synchronize: true,
        };
      },
    }),
    UserModule,
    SaveGameModule,
    CountryModule,
    LeagueModule,
    ClubModule,
    PlayerModule,
    SeedModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
