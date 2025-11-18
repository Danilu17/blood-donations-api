import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { Gender } from '../../../common/enums/gender.enum';
import { Donation } from '../../donations/entities/donation.entity';
import { Campaign } from '../../campaigns/entities/campaign.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  first_name: string;

  @Column({ type: 'varchar', length: 100 })
  last_name: string;

  get name(): string {
    return `${this.first_name} ${this.last_name}`;
  }

  @Column({ type: 'varchar', unique: true })
  dni: string;

  @Column({ type: 'date' })
  birth_date: string;

  @Column({ type: 'enum', enum: Gender })
  gender: Gender;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar', length: 20 })
  phone: string;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  // Seguridad

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'bool', default: false })
  is_email_verified: boolean;

  @Column({
    name: 'email_verification_token',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  email_verification_token: string | null;

  @Column({
    name: 'email_verification_expiry',
    type: 'datetime',
    nullable: true,
  })
  email_verification_expiry: Date | null;

  @Column({
    name: 'password_reset_token',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  password_reset_token: string | null;

  @Column({
    name: 'password_reset_expiry',
    type: 'datetime',
    nullable: true,
  })
  password_reset_expiry: Date | null;

  @Column({ type: 'int', default: 0 })
  failed_login_attempts: number;

  @Column({ type: 'datetime', nullable: true })
  account_locked_until: Date | null;

  @Column({ type: 'bool', default: true })
  is_active: boolean;

  // Donaciones

  @Column({
    name: 'blood_type',
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  blood_type: string | null;

  @Column({ type: 'int', default: 0 })
  donation_count: number;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.DONOR,
  })
  role: UserRole;

  // Relaciones

  @OneToMany(() => Donation, (donation) => donation.donor)
  donations: Donation[];

  @OneToMany(() => Campaign, (camp) => camp.organizer)
  organized_campaigns: Campaign[];

  @OneToMany(() => Campaign, (camp) => camp.proposed_by)
  proposed_campaigns: Campaign[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
