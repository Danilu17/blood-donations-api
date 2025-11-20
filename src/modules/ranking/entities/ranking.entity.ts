import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { RankingLevel } from '../../../common/enums/ranking-level.enum';

@Entity('rankings')
export class Ranking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { eager: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', default: 0 })
  points: number;

  @Column({ type: 'enum', enum: RankingLevel, default: RankingLevel.BRONZE })
  level: RankingLevel;

  @UpdateDateColumn()
  updated_at: Date;
}
