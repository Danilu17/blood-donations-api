import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RoleChangeModule } from './modules/role-change/role-change.module';
import { HealthQuestionnaireModule } from './modules/health-questionnaire/health-questionnaire.module';
import { CertificatesModule } from './modules/certificates/certificates.module';
import { CampaignsModule } from './modules/campaigns/campaigns.module';
import { DonationsModule } from './modules/donations/donations.module';
import { VolunteersModule } from './modules/volunteers/volunteers.module';
import { CentersModule } from './modules/centers/centers.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RankingModule } from './modules/ranking/ranking.module';
import { ReportsModule } from './modules/reports/reports.module';
import { BloodRequestModule } from './modules/blood-requests/blood-requests.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

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
        synchronize: true,
        retryAttempts: 3,
        retryDelay: 2000,
      }),
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        throttlers: [
          {
            ttl: configService.get<number>('THROTTLE_TTL', 60000),
            limit: configService.get<number>('THROTTLE_LIMIT', 100),
          },
        ],
      }),
    }),

    AuthModule,
    UsersModule,
    RoleChangeModule,
    HealthQuestionnaireModule,
    CertificatesModule,
    DonationsModule,
    CampaignsModule,
    VolunteersModule,
    CentersModule,
    EnrollmentsModule,
    NotificationsModule,
    RankingModule,
    ReportsModule,
    BloodRequestModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
