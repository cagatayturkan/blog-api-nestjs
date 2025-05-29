import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UserEntity } from '../../auth/entities/user.entity';
import { ProjectEntity } from '../../projects/entities/project.entity';

@Entity('user_projects')
@Index(['user_id', 'project_id'], { unique: true }) // A user can be assigned to a project only once
export class UserProjectEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Many user-project assignments belong to one user
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'uuid' })
  user_id: string;

  // Many user-project assignments belong to one project
  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ type: 'uuid' })
  project_id: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean; // To enable/disable user access to project

  @CreateDateColumn()
  assigned_at: Date; // When the user was assigned to the project
} 