import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

// Interface'leri doğrudan entity içinde kullanmak yerine,
// entity alanlarını DTO'lar ve servislerdeki interface'lerle uyumlu hale getireceğiz.
// type ContentBlockType = { order: number; title?: string; content: string };
// type SeoDataType = { title: string; description: string };

@Entity('posts') // Veritabanındaki tablo adını 'posts' olarak belirtir
@Index(['project_identifier', 'slug'], { unique: true }) // project_identifier ve slug kombinasyonunu benzersiz yapar
export class PostEntity {
  @PrimaryGeneratedColumn('uuid') // Otomatik artan birincil anahtar (UUID formatında)
  id: string;

  @Column({ type: 'text', nullable: false })
  project_identifier: string; // 'our-news' gibi proje/kategori tanımlayıcısı

  @Column({ type: 'text', nullable: false })
  slug: string;

  @Column({ type: 'text', nullable: false })
  title: string;

  // mock.json'daki attributes.boxContent için JSONB tipi kullanacağız
  // JSONB, PostgreSQL'de JSON verilerini verimli bir şekilde saklamak ve sorgulamak için kullanılır
  @Column({ type: 'jsonb', nullable: true }) // Array of ContentBlockType
  content_blocks: Array<{ order: number; title?: string; content: string }> | null; // Tipini burada belirtiyoruz

  @Column({ type: 'text', array: true, nullable: true }) // PostgreSQL'de string dizisi
  categories: string[] | null;

  @Column({ type: 'text', array: true, nullable: true })
  authors: string[] | null;

  // mock.json'daki attributes.seo için JSONB tipi
  @Column({ type: 'jsonb', nullable: true }) // SeoDataType
  seo_data: { title: string; description:string } | null; // Tipini burada belirtiyoruz

  @Column({ type: 'text', nullable: true })
  featured_image_url: string | null;

  @Column({ type: 'text', nullable: false })
  language: string;

  @Column({ type: 'boolean', default: false }) // Posts start as drafts by default
  is_published: boolean;

  @Column({ type: 'text', nullable: true }) // user_id'yi şimdilik text olarak tutalım
  user_id_ref: string | null; 

  @CreateDateColumn() // Kayıt oluşturulduğunda otomatik olarak tarih ekler
  created_at: Date;

  @UpdateDateColumn() // Kayıt güncellendiğinde otomatik olarak tarih günceller
  updated_at: Date;
} 