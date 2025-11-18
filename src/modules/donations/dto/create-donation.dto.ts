import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsUUID,
  IsEnum,
  IsOptional,
  IsNumber,
  Min,
  Matches,
} from 'class-validator';
import { DonationStatus } from '../../../common/enums/donation-status.enum';

export class CreateDonationDto {
  @ApiProperty({ description: 'ID del donante' })
  @IsUUID()
  donorId: string;

  @ApiProperty({ description: 'ID de la campaña' })
  @IsUUID()
  campaignId: string;

  @ApiProperty({ example: '2025-11-15' })
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  scheduled_date: string;

  @ApiProperty({ example: '08:00' })
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  scheduled_time: string;

  @ApiPropertyOptional({ enum: DonationStatus })
  @IsOptional()
  @IsEnum(DonationStatus)
  status?: DonationStatus;

  @ApiPropertyOptional({ description: 'Cantidad donada (ml)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity_ml?: number;

  @ApiPropertyOptional({ description: 'Notas adicionales' })
  @IsOptional()
  @IsString()
  notes?: string;
}
