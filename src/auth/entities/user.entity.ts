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
import { UserProjectEntity } from '../../user-projects/entities/user-project.entity';
import { PostEntity } from '../../posts/entities/post.entity';

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

  // One user can be assigned to many projects
  @OneToMany(() => UserProjectEntity, (userProject) => userProject.user)
  userProjects: UserProjectEntity[];

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
} 