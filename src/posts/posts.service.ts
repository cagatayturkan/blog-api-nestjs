import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like } from 'typeorm';
import { PostEntity } from './entities/post.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
// mock.json ve eski interface'ler artık kullanılmayacak.

// DTO ve Entity arasında dönüşüm için yardımcı interface'ler/tipler (isteğe bağlı)
// Bu interface'leri Post arayüzümüzle daha uyumlu hale getirebiliriz.
// src/posts/interfaces/post.interface.ts içindeki Post arayüzünü kullanabiliriz.
import { Post as PostInterface, ContentBlock, SeoData } from './interfaces/post.interface';

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private postsRepository: Repository<PostEntity>,
  ) {}

  // Entity'den PostInterface'e dönüşüm (API yanıtları için)
  private mapEntityToInterface(entity: PostEntity): PostInterface {
    return {
      id: entity.id,
      userId: entity.user_id_ref, // Artık PostInterface'deki userId string | null
      title: entity.title,
      slug: entity.slug,
      projectIdentifier: entity.project_identifier,
      contentBlocks: entity.content_blocks || [], // null ise boş dizi
      categories: entity.categories || [], // null ise boş dizi
      authors: entity.authors || [], // null ise boş dizi
      seo: entity.seo_data || undefined, // entity.seo_data null ise undefined olur
      featuredImage: entity.featured_image_url || undefined, // entity.featured_image_url null ise undefined olur
      language: entity.language,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }

  // DTO'dan Entity'ye dönüşüm (Veritabanına yazmak için)
  private mapCreateDtoToEntity(dto: CreatePostDto): Partial<PostEntity> {
    const entity = new PostEntity();
    entity.title = dto.title;
    entity.slug = dto.slug || this.generateSlug(dto.title);
    entity.project_identifier = dto.projectIdentifier;
    entity.content_blocks = dto.contentBlocks;
    entity.categories = dto.categories;
    entity.authors = dto.authors;
    entity.seo_data = dto.seo ? { title: dto.seo.title, description: dto.seo.description } : null; 
    entity.featured_image_url = dto.featuredImage || null; 
    entity.language = dto.language;
    entity.user_id_ref = 'temp-user-id'; // TODO: Bu dinamik olmalı, örn: auth bilgisi veya DTO
    return entity;
  }

  // Slug oluşturma (Bu zaten vardı, kullanmaya devam edebiliriz)
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/\s+/g, '-') 
      .replace(/[^\w\-]+/g, '') 
      .replace(/\-\-+/g, '-') 
      .replace(/^-+/, '') 
      .replace(/-+$/, ''); 
  }

  async create(createPostDto: CreatePostDto): Promise<PostInterface> {
    const partialEntity = this.mapCreateDtoToEntity(createPostDto);
    const newPostEntity = this.postsRepository.create(partialEntity as PostEntity); 
    await this.postsRepository.save(newPostEntity);
    return this.mapEntityToInterface(newPostEntity);
  }

  async findAll(
    page = 1,
    limit = 10,
    sort = 'created_at', // Entity alanına göre sırala (created_at)
    order: 'ASC' | 'DESC' = 'DESC', // Sıralama yönü
    projectIdentifier?: string,
    lang?: string,
    category?: string,
    author?: string,
    searchTerm?: string,
  ): Promise<{ data: PostInterface[]; pagination: any }> {
    const skip = (page - 1) * limit;

    const whereConditions: any = {};
    if (projectIdentifier) whereConditions.project_identifier = projectIdentifier;
    if (lang) whereConditions.language = lang;
    if (searchTerm) {
        whereConditions.title = Like(`%${searchTerm}%`); 
    }

    // Map frontend sort fields to entity field names
    let sortField = sort;
    if (sort === 'createdAt') {
      sortField = 'created_at';
    } else if (sort === 'updatedAt') {
      sortField = 'updated_at';
    }
    // Add other mappings if needed, e.g., 'title' -> 'title' (if it's already correct)

    const findOptions: FindManyOptions<PostEntity> = {
      where: whereConditions,
      order: { [sortField]: order }, // Use the mapped sortField
      take: limit,
      skip: skip,
    };

    const [entities, totalItems] = await this.postsRepository.findAndCount(findOptions);
    
    const totalPages = Math.ceil(totalItems / limit);
    const data = entities.map(entity => this.mapEntityToInterface(entity));

    return {
      data,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        limit,
      },
    };
  }

  async findOneById(id: string): Promise<PostInterface> {
    const entity = await this.postsRepository.findOneBy({ id });
    if (!entity) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
    return this.mapEntityToInterface(entity);
  }

  async findOneBySlugAndProject(
    projectIdentifier: string,
    slug: string,
  ): Promise<PostInterface> {
    const entity = await this.postsRepository.findOneBy({
      project_identifier: projectIdentifier,
      slug: slug,
    });
    if (!entity) {
      throw new NotFoundException(
        `Post with slug "${slug}" in project "${projectIdentifier}" not found`,
      );
    }
    return this.mapEntityToInterface(entity);
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
  ): Promise<PostInterface> {
    const existingEntityToUpdate = await this.postsRepository.findOneBy({ id });
    if (!existingEntityToUpdate) {
      throw new NotFoundException(`Post with ID "${id}" not found for update`);
    }

    const changes = this.mapUpdateDtoToEntityChanges(updatePostDto);
    Object.assign(existingEntityToUpdate, changes);
    
    if (updatePostDto.title && !updatePostDto.slug) {
        existingEntityToUpdate.slug = this.generateSlug(updatePostDto.title);
    }

    await this.postsRepository.save(existingEntityToUpdate);
    return this.mapEntityToInterface(existingEntityToUpdate);
  }

  // Update DTO'dan Entity için partial bir obje oluşturan yardımcı
  private mapUpdateDtoToEntityChanges(dto: UpdatePostDto): Partial<PostEntity> {
    // DTO alanları ile Entity alanları arasındaki eşleştirmeyi tanımla
    const fieldMappings = {
      title: { field: 'title', transform: (value: string) => value },
      slug: { field: 'slug', transform: (value: string) => value },
      projectIdentifier: { field: 'project_identifier', transform: (value: string) => value },
      contentBlocks: { field: 'content_blocks', transform: (value: any[]) => value },
      categories: { field: 'categories', transform: (value: string[]) => value },
      authors: { field: 'authors', transform: (value: string[]) => value },
      seo: { field: 'seo_data', transform: (value: any) => value ? { title: value.title, description: value.description } : null },
      featuredImage: { field: 'featured_image_url', transform: (value: string) => value || null },
      language: { field: 'language', transform: (value: string) => value }
    };

    const changes: Partial<PostEntity> = {};
    
    // DTO'daki tanımlı alanları işle ve entity için dönüşümleri uygula
    Object.entries(fieldMappings).forEach(([dtoKey, mapping]) => {
      if (dto[dtoKey] !== undefined) {
        changes[mapping.field] = mapping.transform(dto[dtoKey]);
      }
    });
    
    return changes;
  }

  async remove(id: string): Promise<void> {
    const result = await this.postsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
  }
}
