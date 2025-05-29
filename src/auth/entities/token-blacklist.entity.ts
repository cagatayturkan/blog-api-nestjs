import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('token_blacklist')
@Index(['token'], { unique: true })
@Index(['expires_at'])
export class TokenBlacklistEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: false })
  token: string;

  @Column({ type: 'uuid', nullable: false })
  user_id: string;

  @Column({ type: 'timestamp', nullable: false })
  expires_at: Date;

  @Column({ type: 'varchar', length: 50, default: 'logout' })
  reason: string; // 'logout', 'password_change', 'admin_revoke', etc.

  @CreateDateColumn()
  created_at: Date;
} 