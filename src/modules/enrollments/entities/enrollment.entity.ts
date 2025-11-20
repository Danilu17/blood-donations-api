import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Campaign } from '../../campaigns/entities/campaign.entity';

/**
 * Estados posibles para una inscripción a una campaña.
 * - pending: el organizador aún no confirma la inscripción.
 * - confirmed: inscripción confirmada y cupo ocupado.
 * - cancelled: la inscripción fue cancelada por el donante u organizador.
 * - waitlist: la campaña ya alcanzó el cupo máximo, el donante queda en lista de espera.
 */
export enum EnrollmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  CANCELLED = 'cancelled',
  WAITLIST = 'waitlist',
}

@Entity('enrollments')
@Unique(['donor', 'campaign'])
export class Enrollment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'donor_id' })
  donor: User;

  @ManyToOne(() => Campaign, { eager: true })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @Column({
    type: 'enum',
    enum: EnrollmentStatus,
    default: EnrollmentStatus.PENDING,
  })
  status: EnrollmentStatus;

  @Column({ type: 'time', nullable: true })
  preferred_time: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
