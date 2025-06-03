import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  BeforeInsert,
  OneToMany,
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../enums/user-role.enum';
import { PostEntity } from '../../posts/entities/post.entity';

export interface PasswordResetData {
  token: string;
  expiresAt: Date;
  createdAt: Date;
}

@Entity('users') // Database table name
@Index(['email'], { unique: true }) // Make email unique
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: false })
  email: string;

  @Column({ type: 'text', nullable: false })
  first_name: string;

  @Column({ type: 'text', nullable: false })
  last_name: string;

  @Column({ type: 'text', nullable: true })
  password: string;

  @Column({ type: 'text', nullable: true })
  google_id: string;

  @Column({ type: 'text', nullable: true })
  picture: string;

  @Column({ type: 'boolean', default: false })
  is_email_verified: boolean;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ type: 'text', nullable: true })
  refresh_token: string;

  // Store project names directly in user table
  @Column({ type: 'text', array: true, default: [] })
  projects: string[];

  // Password reset data stored as JSONB
  @Column({ type: 'jsonb', nullable: true })
  reset: PasswordResetData | null;

  // One user can author many posts
  @OneToMany(() => PostEntity, (post) => post.user)
  posts: PostEntity[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Hash the password before inserting
  @BeforeInsert()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt();
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  // Method to check if a password matches
  async validatePassword(password: string): Promise<boolean> {
    if (!this.password) return false;
    return bcrypt.compare(password, this.password);
  }

  // Helper methods for reset functionality
  isResetTokenValid(token: string): boolean {
    if (!this.reset || this.reset.token !== token) {
      return false;
    }
    // Convert string to Date object if needed (JSONB stores dates as strings)
    const expiresAt =
      typeof this.reset.expiresAt === 'string'
        ? new Date(this.reset.expiresAt)
        : this.reset.expiresAt;
    return new Date() < expiresAt;
  }

  canRequestReset(): boolean {
    if (!this.reset) return true;
    // Allow new request after 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    // Convert string to Date object if needed (JSONB stores dates as strings)
    const createdAt =
      typeof this.reset.createdAt === 'string'
        ? new Date(this.reset.createdAt)
        : this.reset.createdAt;
    return createdAt < fiveMinutesAgo;
  }

  clearReset(): void {
    this.reset = null;
  }
}
