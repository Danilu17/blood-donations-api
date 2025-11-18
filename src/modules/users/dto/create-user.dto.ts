import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsEnum,
  IsDateString,
  Length,
  IsOptional,
} from 'class-validator';
import { Gender } from '../../../common/enums/gender.enum';
import { UserRole } from '../../../common/enums/user-role.enum';

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  @Length(2, 100)
  first_name: string;

  @ApiProperty()
  @IsString()
  @Length(2, 100)
  last_name: string;

  @ApiProperty()
  @IsString()
  @Length(7, 20)
  dni: string;

  @ApiProperty()
  @IsDateString()
  birth_date: string;

  @ApiProperty()
  @IsEnum(Gender)
  gender: Gender;

  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  phone: string;

  @ApiProperty()
  @IsString()
  address: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiPropertyOptional({ enum: UserRole })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
