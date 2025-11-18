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
import { UserRole } from '../../../common/enums/user-role.enum';
import { RoleChangeStatus } from '../../../common/enums/role-change-status.enum';

@Entity('role_change_requests')
export class RoleChangeRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column({ type: 'enum', enum: UserRole })
  current_role: UserRole;

  @Column({ type: 'enum', enum: UserRole })
  requested_role: UserRole;

  @Column({ type: 'text', nullable: true })
  justification?: string;

  @Column({
    type: 'enum',
    enum: RoleChangeStatus,
    default: RoleChangeStatus.PENDING,
  })
  status: RoleChangeStatus;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  reviewed_by?: User;

  @Column({ type: 'text', nullable: true })
  review_notes?: string;

  @Column({ type: 'datetime', nullable: true })
  reviewed_at?: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
