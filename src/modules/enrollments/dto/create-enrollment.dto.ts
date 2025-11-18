import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsOptional, IsString, Matches } from 'class-validator';

export class CreateEnrollmentDto {
  @ApiProperty({ description: 'ID de la campaña' })
  @IsUUID()
  campaignId: string;

  @ApiPropertyOptional({
    description: 'Horario preferido (opcional)',
    example: '10:30',
  })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  preferred_time?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
