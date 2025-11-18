import { PartialType } from '@nestjs/swagger';
import { CreateHealthQuestionnaireDto } from './create-health-questionnaire.dto';

export class UpdateHealthQuestionnaireDto extends PartialType(
  CreateHealthQuestionnaireDto,
) {}
