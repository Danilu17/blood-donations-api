import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsDateString,
  Matches,
  Length,
  IsInt,
  Min,
} from 'class-validator';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Campaña en Hospital Central' })
  @IsString()
  @Length(3, 255)
  name: string;

  @ApiProperty({ example: 'Hospital Central – Av. Rivadavia 1234' })
  @IsString()
  @Length(3, 255)
  location: string;

  @ApiProperty({ example: 'Sala 2 – Piso 1' })
  @IsString()
  @Length(3, 255)
  address: string;

  @ApiProperty({ example: '2025-11-15' })
  @IsDateString()
  campaign_date: string;

  @ApiProperty({ example: '08:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  start_time: string;

  @ApiProperty({ example: '16:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  end_time: string;

  @ApiProperty({ example: 100 })
  @IsInt()
  @Min(1)
  max_donors: number;
}
