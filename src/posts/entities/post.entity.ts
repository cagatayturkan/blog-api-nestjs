import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { ProjectEntity } from '../../projects/entities/project.entity';
import { CategoryEntity } from '../../categories/entities/category.entity';
import { UserEntity } from '../../auth/entities/user.entity';

@Entity('posts') // Specifies the table name as 'posts' in the database
@Index(['project_id', 'slug'], { unique: true }) // project_id and slug combination must be unique
export class PostEntity {
  @PrimaryGeneratedColumn('uuid') // Auto-incrementing primary key (UUID format)
  id: string;

  // Many posts belong to one project
  @ManyToOne(() => ProjectEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectEntity;

  @Column({ type: 'uuid', nullable: false })
  project_id: string;

  @Column({ type: 'text', nullable: false })
  slug: string;

  @Column({ type: 'text', nullable: false })
  title: string;

  // We will use JSONB type for attributes.boxContent in mock.json
  // JSONB is used to efficiently store and query JSON data in PostgreSQL
  @Column({ type: 'jsonb', nullable: true }) // Array of ContentBlockType
  content_blocks: Array<{
    order: number;
    title?: string;
    content: string;
  }> | null; // Tipini burada belirtiyoruz

  // Many-to-Many relationship with categories
  @ManyToMany(() => CategoryEntity)
  @JoinTable({
    name: 'post_categories',
    joinColumn: { name: 'post_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: CategoryEntity[];

  @Column({ type: 'text', array: true, nullable: true }) // PostgreSQL'de string dizisi
  authors: string[] | null;

  // We will use JSONB type for attributes.seo in mock.json
  @Column({ type: 'jsonb', nullable: true }) // SeoDataType
  seo_data: { title: string; description: string } | null; // Tipini burada belirtiyoruz

  @Column({ type: 'text', nullable: true })
  featured_image_url: string | null;

  @Column({ type: 'text', nullable: false })
  language: string;

  @Column({ type: 'boolean', default: false }) // Posts start as drafts by default
  is_published: boolean;

  // Many posts belong to one user (author)
  @ManyToOne(() => UserEntity, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: UserEntity;

  @Column({ type: 'uuid', nullable: true })
  user_id: string | null;

  @CreateDateColumn() // Automatically adds date when record is created
  created_at: Date;

  @UpdateDateColumn() // Automatically updates date when record is updated
  updated_at: Date;
}
