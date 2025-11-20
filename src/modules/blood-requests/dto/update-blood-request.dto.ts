import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { BloodRequestStatus } from '../entities/blood-request.entity';

export class UpdateBloodRequestDto {
  @ApiPropertyOptional({ enum: BloodRequestStatus })
  @IsOptional()
  @IsEnum(BloodRequestStatus)
  status?: BloodRequestStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  review_notes?: string;
}
