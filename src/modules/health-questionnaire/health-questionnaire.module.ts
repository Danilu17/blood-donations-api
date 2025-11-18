import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthQuestionnaireService } from './health-questionnaire.service';
import { HealthQuestionnaireController } from './health-questionnaire.controller';
import { HealthQuestionnaire } from './entities/health-questionnaire.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([HealthQuestionnaire]), UsersModule],
  controllers: [HealthQuestionnaireController],
  providers: [HealthQuestionnaireService],
  exports: [HealthQuestionnaireService, TypeOrmModule],
})
export class HealthQuestionnaireModule {}
