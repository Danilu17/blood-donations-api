import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { BloodType } from '../../../common/enums/blood-type.enum';
import { RhFactor } from '../../../common/enums/rh-factor.enum';
import { EligibilityStatus } from '../../../common/enums/eligibility-status.enum';

@Entity('health_questionnaires')
export class HealthQuestionnaire {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn()
  donor: User;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  weight_kg: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  height_cm: number;

  @Column({ type: 'enum', enum: BloodType })
  blood_type: BloodType;

  @Column({ type: 'enum', enum: RhFactor })
  rh_factor: RhFactor;

  @Column({ type: 'date', nullable: true })
  last_donation_date?: Date;

  @Column({ type: 'bool', default: false })
  has_donated_before: boolean;

  @Column({ type: 'bool', default: false })
  has_chronic_disease: boolean;

  @Column({ type: 'bool', default: false })
  is_taking_medication: boolean;

  @Column({ type: 'bool', default: false })
  had_recent_surgery: boolean;

  @Column({ type: 'bool', default: false })
  had_recent_tattoo_piercing: boolean;

  @Column({ type: 'bool', default: false })
  is_pregnant_or_breastfeeding: boolean;

  @Column({ type: 'bool', default: false })
  had_recent_travel_to_endemic_areas: boolean;

  @Column({ type: 'bool', default: false })
  has_risky_behavior: boolean;

  @Column({ type: 'bool', default: false })
  had_covid_recently: boolean;

  @Column({ type: 'bool', default: false })
  received_vaccine_recently: boolean;

  @Column({ type: 'text', nullable: true })
  additional_notes?: string;

  @Column({ type: 'text', nullable: true })
  ineligibility_reasons: string | null;

  @Column({
    type: 'enum',
    enum: EligibilityStatus,
    default: EligibilityStatus.REQUIRES_REVIEW,
  })
  eligibility_status: EligibilityStatus;

  @Column({ type: 'date', nullable: true })
  next_eligible_date?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
