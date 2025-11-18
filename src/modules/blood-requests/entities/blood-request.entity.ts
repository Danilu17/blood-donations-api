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

export enum BloodRequestStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RESOLVED = 'RESOLVED',
}

@Entity('blood_requests')
export class BloodRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'requested_by' })
  requested_by: User;

  @Column({ type: 'varchar', length: 5 })
  blood_type: string;

  @Column({ type: 'varchar', length: 5 })
  rh_factor: string;

  @Column({ type: 'int' })
  required_units: number;

  @Column({ type: 'text' })
  patient_details: string;

  @Column({
    type: 'enum',
    enum: BloodRequestStatus,
    default: BloodRequestStatus.PENDING,
  })
  status: BloodRequestStatus;

  @Column({ type: 'text', nullable: true })
  rejection_reason?: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
