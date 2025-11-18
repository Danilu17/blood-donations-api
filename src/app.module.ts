import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// Módulos funcionales base
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RoleChangeModule } from './modules/role-change/role-change.module';
import { HealthQuestionnaireModule } from './modules/health-questionnaire/health-questionnaire.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { Donation } from './modules/donations/entities/donation.entity';
import { DonationsModule } from './modules/donations/donations.module';
import { Volunteer } from './modules/volunteers/entities/volunteer.entity';
import { VolunteersModule } from './modules/volunteers/volunteers.module';
import { Center } from './modules/centers/entities/center.entity';
import { CentersModule } from './modules/centers/centers.module';

@Module({
  imports: [
    // 1) Config global (.env)
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    // 2) Conexión a la base de datos (TypeORM + MySQL)
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_NAME'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true, // ⚠️ dejar true solo en desarrollo
        retryAttempts: 3,
        retryDelay: 2000,
      }),
    }),

    // 3) Rate limiting global (Throttler)
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('THROTTLE_TTL', 60000), // 60s
            limit: configService.get<number>('THROTTLE_LIMIT', 100), // 100 req
          },
        ],
      }),
    }),

    // 4) Módulos funcionales que SÍ usamos por ahora
    AuthModule,
    UsersModule,
    RoleChangeModule,
    HealthQuestionnaireModule,
    CertificatesModule,
    DonationsModule,
    CampaignsModule,
    VolunteersModule,
    CentersModule,
  ],

  providers: [
    // 5) Guard global para Throttling
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
