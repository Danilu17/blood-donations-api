import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsInt, Min, IsIn } from 'class-validator';
import { RoleChangeStatus } from '../../../common/enums/role-change-status.enum';

export class FilterRoleChangeDto {
  @ApiPropertyOptional({ enum: RoleChangeStatus })
  @IsOptional()
  @IsEnum(RoleChangeStatus)
  status?: RoleChangeStatus;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sort?: 'asc' | 'desc';

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  page?: number = 0;
}
