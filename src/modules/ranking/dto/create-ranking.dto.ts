import { IsUUID, IsInt, IsOptional } from 'class-validator';
import { RankingLevel } from '../../../common/enums/ranking-level.enum';

export class CreateRankingDto {
  @IsUUID()
  userId: string;

  @IsInt()
  @IsOptional()
  points?: number;

  @IsOptional()
  level?: RankingLevel;
}
