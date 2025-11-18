import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Campaign } from '../../campaigns/entities/campaign.entity';
import { DonationStatus } from '../../../common/enums/donation-status.enum';

@Entity('donations')
export class Donation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.donations, { eager: true })
  @JoinColumn({ name: 'donor_id' })
  donor: User;

  @ManyToOne(() => Campaign, (camp) => camp.donations, { eager: true })
  @JoinColumn({ name: 'campaign_id' })
  campaign: Campaign;

  @Column({ type: 'date', nullable: true })
  scheduled_date: string | null;

  @Column({ type: 'time', nullable: true })
  scheduled_time: string | null;

  @Column({ type: 'date', nullable: true })
  actual_date: string | null;

  @Column({
    name: 'certificate_id',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  certificate_id: string | null;

  @Column({ type: 'int', nullable: true })
  quantity_ml: number | null;

  @Column({
    type: 'enum',
    enum: DonationStatus,
    default: DonationStatus.SCHEDULED,
  })
  status: DonationStatus;

  @Column({
    name: 'notes',
    type: 'text',
    nullable: true,
  })
  notes: string | null;

  @CreateDateColumn()
  created_at: Date;
}
