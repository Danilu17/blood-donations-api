import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, Min, IsNotEmpty } from 'class-validator';

export class CreateBloodRequestDto {
  @ApiProperty({ example: 'O' })
  @IsString()
  blood_type: string;

  @ApiProperty({ example: '+' })
  @IsString()
  rh_factor: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  required_units: number;

  @ApiProperty({
    example: 'Paciente masculino 45 años internado en Hospital X',
  })
  @IsString()
  @IsNotEmpty()
  patient_details: string;
}
