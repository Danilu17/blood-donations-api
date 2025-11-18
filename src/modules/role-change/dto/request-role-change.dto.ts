import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class RequestRoleChangeDto {
  @ApiProperty({ enum: UserRole })
  @IsEnum(UserRole)
  @IsNotEmpty()
  requested_role: UserRole;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  justification?: string;
}
