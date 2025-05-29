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

// Interface'leri doğrudan entity içinde kullanmak yerine,
// entity alanlarını DTO'lar ve servislerdeki interface'lerle uyumlu hale getireceğiz.
// type ContentBlockType = { order: number; title?: string; content: string };
// type SeoDataType = { title: string; description: string };

@Entity('posts') // Veritabanındaki tablo adını 'posts' olarak belirtir
@Index(['project_id', 'slug'], { unique: true }) // project_id and slug combination must be unique
export class PostEntity {
  @PrimaryGeneratedColumn('uuid') // Otomatik artan birincil anahtar (UUID formatında)
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

  // mock.json'daki attributes.boxContent için JSONB tipi kullanacağız
  // JSONB, PostgreSQL'de JSON verilerini verimli bir şekilde saklamak ve sorgulamak için kullanılır
  @Column({ type: 'jsonb', nullable: true }) // Array of ContentBlockType
  content_blocks: Array<{ order: number; title?: string; content: string }> | null; // Tipini burada belirtiyoruz

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

  // mock.json'daki attributes.seo için JSONB tipi
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

  @CreateDateColumn() // Kayıt oluşturulduğunda otomatik olarak tarih ekler
  created_at: Date;

  @UpdateDateColumn() // Kayıt güncellendiğinde otomatik olarak tarih günceller
  updated_at: Date;
} 