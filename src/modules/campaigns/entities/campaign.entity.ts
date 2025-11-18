import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Donation } from '../../donations/entities/donation.entity';
import { CampaignStatus } from '../../../common/enums/campaign-status.enum';

@Entity('campaigns')
export class Campaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  location: string;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'date' })
  campaign_date: string;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column({ type: 'int', default: 0 })
  current_donors: number;

  @Column({ type: 'int', default: 0 })
  max_donors: number;

  @Column({ type: 'bool', default: false })
  is_featured: boolean;

  @Column({
    type: 'enum',
    enum: CampaignStatus,
    default: CampaignStatus.ACTIVE,
  })
  status: CampaignStatus;

  @Column({
    name: 'rejection_reason',
    type: 'text',
    nullable: true,
  })
  rejection_reason: string | null;

  @ManyToOne(() => User, (user) => user.organized_campaigns, { nullable: true })
  organizer: User;

  @ManyToOne(() => User, (user) => user.proposed_campaigns, { nullable: true })
  proposed_by: User;

  @OneToMany(() => Donation, (don) => don.campaign)
  donations: Donation[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
