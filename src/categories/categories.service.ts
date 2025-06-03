import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { CategoryEntity } from './entities/category.entity';
import { ProjectEntity } from '../projects/entities/project.entity';
import { PostEntity } from '../posts/entities/post.entity';
import { UserProjectsService } from '../user-projects/user-projects.service';
import {
  CreateCategoryDto,
  CreateCategoryWithProjectDto,
} from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './interfaces/category.interface';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(CategoryEntity)
    private categoryRepository: Repository<CategoryEntity>,
    @InjectRepository(ProjectEntity)
    private projectRepository: Repository<ProjectEntity>,
    @InjectRepository(PostEntity)
    private postRepository: Repository<PostEntity>,
    private userProjectsService: UserProjectsService,
  ) {}

  // Convert Entity to Interface
  private mapEntityToInterface(entity: CategoryEntity): Category {
    return {
      id: entity.id,
      name: entity.name,
      slug: entity.slug,
      description: entity.description,
      projectId: entity.project.id,
      projectName: entity.project?.name,
      createdAt: entity.created_at,
      updatedAt: entity.updated_at,
    };
  }

  // Generate slug
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  }

  // Generate unique slug (unique within project)
  private async generateUniqueSlug(
    name: string,
    projectId: string,
    excludeId?: string,
  ): Promise<string> {
    const baseSlug = this.generateSlug(name);
    let slug = baseSlug;
    let counter = 1;

    while (true) {
      const whereConditions: any = {
        project: { id: projectId },
        slug: slug,
      };

      if (excludeId) {
        whereConditions.id = Not(excludeId);
      }

      const existingCategory = await this.categoryRepository.findOne({
        where: whereConditions,
      });

      if (!existingCategory) {
        return slug;
      }

      slug = `${baseSlug}-${counter}`;
      counter++;
    }
  }

  async create(
    createCategoryDto: CreateCategoryWithProjectDto,
    userId: string,
  ): Promise<Category> {
    // Check if project exists
    const project = await this.projectRepository.findOne({
      where: { id: createCategoryDto.projectId },
    });
    if (!project) {
      throw new NotFoundException(
        `Project with ID "${createCategoryDto.projectId}" not found`,
      );
    }

    // Check if user has access to project
    const hasAccess =
      await this.userProjectsService.checkUserHasAccessToProject(
        userId,
        project.name,
      );
    if (!hasAccess) {
      throw new ForbiddenException(
        `You don't have access to project "${project.name}"`,
      );
    }

    // Check if category name already exists in project
    const existingCategory = await this.categoryRepository.findOne({
      where: {
        name: createCategoryDto.name,
        project: { id: createCategoryDto.projectId },
      },
    });

    if (existingCategory) {
      throw new ConflictException(
        `Category "${createCategoryDto.name}" already exists in this project`,
      );
    }

    // Generate unique slug if not provided (if not provided, generate unique slug)
    const slug =
      createCategoryDto.slug ||
      (await this.generateUniqueSlug(
        createCategoryDto.name,
        createCategoryDto.projectId,
      ));

    // Create category
    const category = this.categoryRepository.create({
      name: createCategoryDto.name,
      slug: slug,
      description: createCategoryDto.description,
      project: project,
    });

    const savedCategory = await this.categoryRepository.save(category);

    // Load with relations for response (load with relations for response)
    const categoryWithProject = await this.categoryRepository.findOne({
      where: { id: savedCategory.id },
      relations: ['project'],
    });

    if (!categoryWithProject) {
      throw new NotFoundException('Failed to load created category');
    }

    return this.mapEntityToInterface(categoryWithProject);
  }

  async findAllByProject(
    projectName: string,
    userId: string,
  ): Promise<Category[]> {
    // First verify project exists
    const project = await this.projectRepository.findOne({
      where: { name: projectName },
    });
    if (!project) {
      throw new NotFoundException(`Project "${projectName}" not found`);
    }

    // Check if user has access to project
    const hasAccess =
      await this.userProjectsService.checkUserHasAccessToProject(
        userId,
        projectName,
      );
    if (!hasAccess) {
      throw new ForbiddenException(`You don't have access to this project`);
    }

    const categories = await this.categoryRepository.find({
      where: { project: { id: project.id } },
      relations: ['project'],
      order: { name: 'ASC' },
    });

    return categories.map((category) => this.mapEntityToInterface(category));
  }

  async findOne(id: string, userId: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['project'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    // Check if user has access to project
    const hasAccess =
      await this.userProjectsService.checkUserHasAccessToProject(
        userId,
        category.project.name,
      );
    if (!hasAccess) {
      throw new ForbiddenException(`You don't have access to this project`);
    }

    return this.mapEntityToInterface(category);
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    userId: string,
    userRole: string,
  ): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['project'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    // Check if user has access to project
    const hasAccess =
      await this.userProjectsService.checkUserHasAccessToProject(
        userId,
        category.project.name,
      );
    if (!hasAccess) {
      throw new ForbiddenException(`You don't have access to this project`);
    }

    // If changing project, check access to new project (only SUPER_ADMIN can move categories between projects)
    if (
      updateCategoryDto.projectId &&
      updateCategoryDto.projectId !== category.project.id
    ) {
      if (userRole !== 'SUPER_ADMIN') {
        throw new ForbiddenException(
          'Only SUPER_ADMIN can move categories between projects',
        );
      }

      const newProject = await this.projectRepository.findOne({
        where: { id: updateCategoryDto.projectId },
      });
      if (!newProject) {
        throw new NotFoundException(
          `Project with ID "${updateCategoryDto.projectId}" not found`,
        );
      }
      category.project = newProject;
    }

    // Check for name conflicts in the target project
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const targetProjectId =
        updateCategoryDto.projectId || category.project.id;
      const existingCategory = await this.categoryRepository.findOne({
        where: {
          name: updateCategoryDto.name,
          project: { id: targetProjectId },
          id: Not(id),
        },
      });

      if (existingCategory) {
        throw new ConflictException(
          `Category "${updateCategoryDto.name}" already exists in this project`,
        );
      }
    }

    // Update category properties
    if (updateCategoryDto.name) {
      category.name = updateCategoryDto.name;
    }
    if (updateCategoryDto.description !== undefined) {
      category.description = updateCategoryDto.description;
    }

    const updatedCategory = await this.categoryRepository.save(category);
    return this.mapEntityToInterface(updatedCategory);
  }

  async remove(id: string, userId: string, userRole: string): Promise<void> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['project'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID "${id}" not found`);
    }

    // Check if user has access to this project
    const hasAccess =
      await this.userProjectsService.checkUserHasAccessToProject(
        userId,
        category.project.name,
      );
    if (!hasAccess) {
      throw new ForbiddenException(`You don't have access to this project`);
    }

    // Check if category is being used by posts (updated for string array approach)
    const postCount = await this.postRepository
      .createQueryBuilder('post')
      .where('post.project_id = :projectId', { projectId: category.project.id })
      .andWhere(':categoryName = ANY(post.categories)', {
        categoryName: category.name,
      })
      .getCount();

    if (postCount > 0) {
      throw new ConflictException(
        `Cannot delete category "${category.name}" because it is being used by ${postCount} post(s)`,
      );
    }

    await this.categoryRepository.remove(category);
  }

  // Public method for getting categories by project name (used by middleware)
  async findByProjectName(projectName: string): Promise<Category[]> {
    const categories = await this.categoryRepository.find({
      where: { project: { name: projectName } },
      relations: ['project'],
      order: { name: 'ASC' },
    });

    return categories.map((category) => this.mapEntityToInterface(category));
  }

  // Public method for getting categories by project ID (public endpoint)
  async findAllByProjectPublic(projectId: string): Promise<Category[]> {
    const categories = await this.categoryRepository.find({
      where: {
        project: { id: projectId },
        is_active: true, // Only show active categories for public access
      },
      relations: ['project'],
      order: { name: 'ASC' },
    });

    return categories.map((category) => this.mapEntityToInterface(category));
  }
}
