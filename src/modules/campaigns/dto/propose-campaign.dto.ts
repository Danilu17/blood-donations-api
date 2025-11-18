import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsInt,
  Min,
  MaxLength,
  Matches,
  IsOptional,
} from 'class-validator';

export class ProposeCampaignDto {
  @ApiProperty({ example: 'Campaña urgente para paciente O+' })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 'Descripción y justificación' })
  @IsString()
  @MaxLength(2000)
  description: string;

  @ApiProperty({ example: '2025-12-20' })
  @IsDateString()
  campaign_date: string;

  @ApiProperty({ example: '09:00' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  start_time: string;

  @ApiProperty({ example: '15:00' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  end_time: string;

  @ApiProperty({ example: 'Hospital Fernández' })
  @IsString()
  location: string;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(1)
  max_donors: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  requirements?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  contact_info?: string;
}
