import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { CategoryEntity } from '../../categories/entities/category.entity';
import { PostEntity } from '../../posts/entities/post.entity';

@Entity('projects')
@Index(['name'], { unique: true }) // Project name must be unique
export class ProjectEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: false })
  name: string; // Project identifier name like "tech-blog", "sport-news"

  @Column({ type: 'text', nullable: true })
  url: string; // Optional project URL

  @Column({ type: 'text', nullable: true })
  description: string; // Project description

  @Column({ type: 'boolean', default: true })
  is_active: boolean; // To enable/disable projects

  // One project has many categories
  @OneToMany(() => CategoryEntity, (category) => category.project)
  categories: CategoryEntity[];

  // One project has many posts
  @OneToMany(() => PostEntity, (post) => post.project)
  posts: PostEntity[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
