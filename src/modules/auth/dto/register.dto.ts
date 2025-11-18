import {
  IsString,
  IsEmail,
  IsNotEmpty,
  MinLength,
  Matches,
  IsEnum,
  IsDateString,
  Length,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Gender } from '../../../common/enums/gender.enum';

export class RegisterDto {
  @ApiProperty({ example: 'Juan' })
  @IsString()
  @Length(2, 100)
  first_name: string;

  @ApiProperty({ example: 'Pérez' })
  @IsString()
  @Length(2, 100)
  last_name: string;

  @ApiProperty({ example: '12345678' })
  @IsString()
  @Length(7, 20)
  dni: string;

  @ApiProperty({ example: '1990-05-15' })
  @IsDateString()
  birth_date: string;

  @ApiProperty({ enum: Gender })
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty({ example: 'email@dominio.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+5491112345678' })
  @IsString()
  phone: string;

  @ApiProperty({ example: 'Av. Corrientes 1234' })
  @IsString()
  address: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).*$/, {
    message: 'La contraseña debe tener mayúscula, minúscula y número',
  })
  password: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  accepts_terms: boolean;
}
