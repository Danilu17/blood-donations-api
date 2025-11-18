import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  Min,
  Max,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';
import { BloodType } from '../../../common/enums/blood-type.enum';
import { RhFactor } from '../../../common/enums/rh-factor.enum';

export class CreateHealthQuestionnaireDto {
  @ApiProperty({ example: 70 })
  @IsNumber()
  @Min(50)
  weight_kg: number;

  @ApiProperty({ example: 175 })
  @IsNumber()
  @Min(100)
  @Max(250)
  height_cm: number;

  @ApiProperty({ enum: BloodType })
  @IsEnum(BloodType)
  blood_type: BloodType;

  @ApiProperty({ enum: RhFactor })
  @IsEnum(RhFactor)
  rh_factor: RhFactor;

  @ApiPropertyOptional({ example: '2024-06-10' })
  @IsOptional()
  @IsDateString()
  last_donation_date?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  has_donated_before: boolean;

  @ApiProperty()
  @IsBoolean()
  has_chronic_disease: boolean;

  @ApiProperty()
  @IsBoolean()
  is_taking_medication: boolean;

  @ApiProperty()
  @IsBoolean()
  had_recent_surgery: boolean;

  @ApiProperty()
  @IsBoolean()
  had_recent_tattoo_piercing: boolean;

  @ApiProperty()
  @IsBoolean()
  is_pregnant_or_breastfeeding: boolean;

  @ApiProperty()
  @IsBoolean()
  had_recent_travel_to_endemic_areas: boolean;

  @ApiProperty()
  @IsBoolean()
  has_risky_behavior: boolean;

  @ApiProperty()
  @IsBoolean()
  had_covid_recently: boolean;

  @ApiProperty()
  @IsBoolean()
  received_vaccine_recently: boolean;

  @ApiPropertyOptional({ example: 'Tomo vitaminas' })
  @IsOptional()
  @IsString()
  additional_notes?: string;
}
