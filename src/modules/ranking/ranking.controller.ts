import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('ranking')
@UseGuards(JwtAuthGuard)
export class RankingController {
  constructor(private readonly rankingService: RankingService) {}

  // Ranking global
  @Get()
  getAll() {
    return this.rankingService.getRankingList();
  }

  // Ranking del usuario autenticado
  @Get('me')
  getMine(@Req() req: any) {
    const userId = req.user.id;
    return this.rankingService.getUserRanking(userId);
  }
}
