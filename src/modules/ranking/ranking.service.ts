import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ranking } from './entities/ranking.entity';
import { User } from '../users/entities/user.entity';
import { RankingLevel } from '../../common/enums/ranking-level.enum';

@Injectable()
export class RankingService {
  constructor(
    @InjectRepository(Ranking)
    private readonly rankingRepo: Repository<Ranking>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private computeLevel(points: number): RankingLevel {
    if (points >= 100) return RankingLevel.GOLD;
    if (points >= 50) return RankingLevel.SILVER;
    return RankingLevel.BRONZE;
  }

  /**
   * Recalcula el ranking de un usuario basado en su cuenta de donaciones.
   * Cada donación otorga 10 puntos.  El nivel se define por:
   * - Bronze: < 50 puntos
   * - Silver: ≥ 50 y < 100 puntos
   * - Gold: ≥ 100 puntos
   */
  async updateRankingForUser(userId: string): Promise<Ranking> {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    const points = (user.donation_count ?? 0) * 10;
    const level = this.computeLevel(points);
    let ranking = await this.rankingRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!ranking) {
      ranking = this.rankingRepo.create({ user, points, level });
    } else {
      ranking.points = points;
      ranking.level = level;
    }
    return this.rankingRepo.save(ranking);
  }

  /** Obtiene el ranking de un usuario.  Si no existe, lo calcula. */
  async getUserRanking(userId: string): Promise<Ranking> {
    let ranking = await this.rankingRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!ranking) {
      ranking = await this.updateRankingForUser(userId);
    }
    return ranking;
  }

  /** Obtiene todos los rankings ordenados de mayor a menor puntaje */
  async getRankingList(): Promise<Ranking[]> {
    // Actualizar los puntos de todos los usuarios antes de listarlos
    const users = await this.userRepo.find();
    for (const user of users) {
      await this.updateRankingForUser(user.id);
    }
    return this.rankingRepo.find({ order: { points: 'DESC' } });
  }
}
