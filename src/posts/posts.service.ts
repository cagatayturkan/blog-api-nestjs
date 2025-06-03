import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Like, Not } from 'typeorm';
import { PostEntity } from './entities/post.entity';
import { ProjectEntity } from '../projects/entities/project.entity';
import { CategoryEntity } from '../categories/entities/category.entity';
import { UserProjectsService } from '../user-projects/user-projects.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post as PostInterface } from './interfaces/post.interface';
// mock.json ve eski interface'ler artık kullanılmayacak.

// DTO ve Entity arasında dönüşüm için yardımcı interface'ler/tipler (isteğe bağlı)
// Bu interface'leri Post arayüzümüzle daha uyumlu hale getirebiliriz.
// src/posts/interfaces/post.interface.ts içindeki Post arayüzünü kullanabiliriz.

@Injectable()
export class PostsService {
  constructor(
    @InjectRepository(PostEntity)
    private postsRepository: Repository<PostEntity>,
    @InjectRepository(ProjectEntity)
    private projectsRepository: Repository<ProjectEntity>,
    @InjectRepository(CategoryEntity)
    private categoriesRepository: Repository<CategoryEntity>,
    private userProjectsService: UserProjectsService,
  ) {}

  // Entity'den Interface'e dönüşüm (API response için)
  private mapEntityToInterface(entity: PostEntity): PostInterface {
    return {
      id: entity.id,
      projectId: entity.project_id,
      slug: entity.slug,
      title: entity.title,
      contentBlocks: entity.content_blocks,
      categories: entity.categories || null,
      authors: entity.authors,
      seo: entity.seo_data,
      featuredImage: entity.featured_image_url,
      language: entity.language,
      isPublished: entity.is_published,
      userId: entity.user_id,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }

  // DTO'dan Entity'ye dönüşüm (Veritabanına yazmak için)
  private async mapCreateDtoToEntity(dto: CreatePostDto): Promise<Partial<PostEntity>> {
    if (!dto.projectId) {
      throw new Error('Project ID is required');
    }
    
    // Validate categories exist in the database for this project
    if (dto.categories && dto.categories.length > 0) {
      await this.validateCategories(dto.categories, dto.projectId);
    }
    
    const entity = new PostEntity();
    entity.title = dto.title;
    entity.slug = dto.slug || this.generateSlug(dto.title);
    entity.project_id = dto.projectId;
    entity.content_blocks = dto.contentBlocks;
    entity.categories = dto.categories;
    entity.authors = dto.authors;
    entity.seo_data = dto.seo ? { title: dto.seo.title, description: dto.seo.description } : null;
    entity.featured_image_url = dto.featuredImage || null;
    entity.language = dto.language;
    entity.is_published = dto.isPublished ?? false;
    return entity;
  }

  // Validate that all categories exist in the database for the given project
  private async validateCategories(categoryNames: string[], projectId: string): Promise<void> {
    const existingCategories = await this.categoriesRepository.find({
      where: { 
        project_id: projectId,
        is_active: true 
      }
    });
    
    const existingCategoryNames = existingCategories.map(cat => cat.name);
    const invalidCategories = categoryNames.filter(name => !existingCategoryNames.includes(name));
    
    if (invalidCategories.length > 0) {
      throw new BadRequestException(
        `The following categories do not exist in this project: ${invalidCategories.join(', ')}. ` +
        `Available categories: ${existingCategoryNames.join(', ')}`
      );
    }
  }

  // Slug oluşturma
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  // Unique slug oluşturma (project içinde benzersiz olması için)
  private async generateUniqueSlug(title: string, projectId: string, excludeId?: string): Promise<string> {
    let baseSlug = this.generateSlug(title);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const whereConditions: any = {
        project_id: projectId,
        slug: slug,
      };
      
      if (excludeId) {
        whereConditions.id = Not(excludeId);
      }

      const existingPost = await this.postsRepository.findOneBy(whereConditions);
      
      if (!existingPost) {
        return slug;
      }
      
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  async create(createPostDto: CreatePostDto, userId: string): Promise<PostInterface> {
    if (!createPostDto.projectId) {
      throw new Error('Project ID is required');
    }
    
    // Verify project exists
    const project = await this.projectsRepository.findOneBy({ id: createPostDto.projectId });
    if (!project) {
      throw new NotFoundException(`Project with ID "${createPostDto.projectId}" not found`);
    }

    // Check if user has access to this project
    const hasAccess = await this.userProjectsService.checkUserHasAccessToProject(userId, project.name);
    if (!hasAccess) {
      throw new ForbiddenException(`You don't have access to project "${project.name}"`);
    }

    const partialEntity = await this.mapCreateDtoToEntity(createPostDto);
    partialEntity.user_id = userId;
    
    // Generate unique slug if not provided
    if (!createPostDto.slug) {
      partialEntity.slug = await this.generateUniqueSlug(createPostDto.title, createPostDto.projectId);
    }
    
    const newPostEntity = this.postsRepository.create(partialEntity as PostEntity);
    await this.postsRepository.save(newPostEntity);
    
    // Load relations for response
    const savedEntity = await this.postsRepository.findOne({
      where: { id: newPostEntity.id },
      relations: ['project', 'user'],
    });
    
    if (!savedEntity) {
      throw new NotFoundException('Failed to load created post');
    }
    
    return this.mapEntityToInterface(savedEntity);
  }

  async findAll(
    page = 1,
    limit = 10,
    sort = 'created_at',
    order: 'ASC' | 'DESC' = 'DESC',
    projectIdentifier?: string,
    lang?: string,
    categoryId?: string,
    author?: string,
    searchTerm?: string,
    onlyPublished = true,
  ): Promise<{ data: PostInterface[]; pagination: any }> {
    const skip = (page - 1) * limit;

    const whereConditions: any = {};
    
    // Convert projectIdentifier (name) to projectId if provided
    if (projectIdentifier) {
      const project = await this.projectsRepository.findOneBy({ name: projectIdentifier });
      if (project) {
        whereConditions.project_id = project.id;
      } else {
        // If project not found, return empty result
        return {
          data: [],
          pagination: {
            currentPage: page,
            totalPages: 0,
            totalItems: 0,
            limit,
          },
        };
      }
    }
    
    if (lang) whereConditions.language = lang;
    if (onlyPublished) whereConditions.is_published = true;
    if (searchTerm) {
      whereConditions.title = Like(`%${searchTerm}%`);
    }

    let sortField = sort;
    if (sort === 'createdAt') {
      sortField = 'created_at';
    } else if (sort === 'updatedAt') {
      sortField = 'updated_at';
    }

    const findOptions: FindManyOptions<PostEntity> = {
      where: whereConditions,
      order: { [sortField]: order },
      take: limit,
      skip: skip,
      relations: ['project', 'user'],
    };

    // Category filtering would need a more complex query with QueryBuilder
    // For now, we'll handle it in the basic where conditions if needed

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

  async findOneById(id: string, includeUnpublished = false): Promise<PostInterface> {
    const whereConditions: any = { id };
    if (!includeUnpublished) {
      whereConditions.is_published = true;
    }
    
    const entity = await this.postsRepository.findOne({
      where: whereConditions,
      relations: ['project', 'user'],
    });
    
    if (!entity) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
    return this.mapEntityToInterface(entity);
  }

  async findOneBySlugAndProject(
    projectIdentifier: string,
    slug: string,
    includeUnpublished = false,
  ): Promise<PostInterface> {
    // Convert projectIdentifier (name) to projectId
    const project = await this.projectsRepository.findOneBy({ name: projectIdentifier });
    if (!project) {
      throw new NotFoundException(`Project "${projectIdentifier}" not found`);
    }
    
    const whereConditions: any = {
      project_id: project.id,
      slug: slug,
    };
    if (!includeUnpublished) {
      whereConditions.is_published = true;
    }
    
    const entity = await this.postsRepository.findOne({
      where: whereConditions,
      relations: ['project', 'user'],
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
    userId: string,
    userRole: string,
  ): Promise<PostInterface> {
    const existingEntityToUpdate = await this.postsRepository.findOne({
      where: { id },
      relations: ['project', 'user'],
    });
    
    if (!existingEntityToUpdate) {
      throw new NotFoundException(`Post with ID "${id}" not found for update`);
    }

    // Check if user has access to this project
    const hasAccess = await this.userProjectsService.checkUserHasAccessToProject(userId, existingEntityToUpdate.project.name);
    if (!hasAccess) {
      throw new ForbiddenException(`You don't have access to this project`);
    }

    // Check ownership: Only SUPER_ADMIN or the post owner can update
    if (userRole !== 'SUPER_ADMIN' && existingEntityToUpdate.user_id !== userId) {
      throw new ForbiddenException('You can only update your own posts');
    }

    const changes = await this.mapUpdateDtoToEntityChanges(updatePostDto, existingEntityToUpdate.project_id);
    Object.assign(existingEntityToUpdate, changes);
    
    // Generate unique slug if title changed and no slug provided
    if (updatePostDto.title && !updatePostDto.slug) {
      existingEntityToUpdate.slug = await this.generateUniqueSlug(
        updatePostDto.title,
        existingEntityToUpdate.project_id,
        id,
      );
    }

    await this.postsRepository.save(existingEntityToUpdate);
    
    // Reload with relations
    const updatedEntity = await this.postsRepository.findOne({
      where: { id },
      relations: ['project', 'user'],
    });
    
    if (!updatedEntity) {
      throw new NotFoundException('Failed to load updated post');
    }
    
    return this.mapEntityToInterface(updatedEntity);
  }

  private async mapUpdateDtoToEntityChanges(dto: UpdatePostDto, projectId: string): Promise<Partial<PostEntity>> {
    const changes: Partial<PostEntity> = {};
    
    if (dto.title !== undefined) changes.title = dto.title;
    if (dto.slug !== undefined) changes.slug = dto.slug;
    if (dto.projectId !== undefined) changes.project_id = dto.projectId;
    if (dto.contentBlocks !== undefined) changes.content_blocks = dto.contentBlocks;
    if (dto.authors !== undefined) changes.authors = dto.authors;
    if (dto.language !== undefined) changes.language = dto.language;
    if (dto.isPublished !== undefined) changes.is_published = dto.isPublished;
    if (dto.featuredImage !== undefined) changes.featured_image_url = dto.featuredImage;
    
    if (dto.seo !== undefined) {
      changes.seo_data = dto.seo ? { title: dto.seo.title, description: dto.seo.description } : null;
    }
    
    // Handle categories with validation
    if (dto.categories !== undefined) {
      if (dto.categories && dto.categories.length > 0) {
        await this.validateCategories(dto.categories, projectId);
      }
      changes.categories = dto.categories;
    }
    
    return changes;
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const existingEntity = await this.postsRepository.findOne({
      where: { id },
      relations: ['project'],
    });
    if (!existingEntity) {
      throw new NotFoundException(`Post with ID "${id}" not found for deletion`);
    }

    // Check if user has access to this project
    const hasAccess = await this.userProjectsService.checkUserHasAccessToProject(userId, existingEntity.project.name);
    if (!hasAccess) {
      throw new ForbiddenException(`You don't have access to this project`);
    }

    // Check ownership: Only SUPER_ADMIN or the post owner can delete
    if (userRole !== 'SUPER_ADMIN' && existingEntity.user_id !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.postsRepository.remove(existingEntity);
  }
}
