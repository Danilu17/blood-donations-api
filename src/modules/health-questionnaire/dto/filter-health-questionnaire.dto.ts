import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min, IsIn } from 'class-validator';
import { EligibilityStatus } from '../../../common/enums/eligibility-status.enum';

export class FilterHealthQuestionnaireDto {
  @ApiPropertyOptional({ enum: EligibilityStatus })
  @IsOptional()
  @IsEnum(EligibilityStatus)
  status?: EligibilityStatus;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort?: 'asc' | 'desc';

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  page?: number = 0;
}
