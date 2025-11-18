// src/modules/certificates/entities/certificate.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Donation } from '../../donations/entities/donation.entity';

@Entity('certificates')
export class Certificate {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /**
   * Cada certificado pertenece a UNA donación.
   * Hacemos relación 1:1 porque una donación solo debería tener un certificado.
   */
  @OneToOne(() => Donation, { eager: true })
  @JoinColumn({ name: 'donation_id' })
  donation: Donation;

  @Column({
    name: 'verification_code',
    type: 'varchar',
    length: 255,
    unique: true,
  })
  verification_code: string;

  @Column({ type: 'datetime' })
  issued_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
