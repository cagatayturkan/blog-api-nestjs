import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ProjectEntity } from '../../projects/entities/project.entity';

@Entity('categories')
@Index(['name', 'project_id'], { unique: true }) // Category name must be unique within a project
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: false })
  name: string; // Category name like "Teknoloji", "Spor", etc.

  @Column({ type: 'text', nullable: true })
  description: string; // Category description

  @Column({ type: 'text', nullable: true })
  slug: string; // URL-friendly version of name

  @Column({ type: 'boolean', default: true })
  is_active: boolean; // To enable/disable categories

  // Many categories belong to one project
  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ type: 'uuid' })
  project_id: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
} 