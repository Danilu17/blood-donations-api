import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsString, IsOptional } from 'class-validator';
import { RoleChangeStatus } from '../../../common/enums/role-change-status.enum';

export class ReviewRoleChangeDto {
  @ApiProperty({
    enum: [RoleChangeStatus.APPROVED, RoleChangeStatus.REJECTED],
  })
  @IsEnum([RoleChangeStatus.APPROVED, RoleChangeStatus.REJECTED])
  status: RoleChangeStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  review_notes?: string;
}
