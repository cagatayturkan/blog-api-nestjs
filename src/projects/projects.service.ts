import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from './entities/project.entity';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(ProjectEntity)
    private projectRepository: Repository<ProjectEntity>,
  ) {}

  async findAll(): Promise<ProjectEntity[]> {
    return this.projectRepository.find({
      where: { is_active: true },
      order: { created_at: 'DESC' },
    });
  }

  async findAllForAdmin(): Promise<ProjectEntity[]> {
    return this.projectRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<ProjectEntity> {
    const project = await this.projectRepository.findOne({
      where: { id, is_active: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    return project;
  }

  async findByName(name: string): Promise<ProjectEntity> {
    const project = await this.projectRepository.findOne({
      where: { name, is_active: true },
    });

    if (!project) {
      throw new NotFoundException(`Project with name "${name}" not found`);
    }

    return project;
  }

  async create(createProjectDto: CreateProjectDto): Promise<ProjectEntity> {
    // Check if project name already exists
    const existingProject = await this.projectRepository.findOne({
      where: { name: createProjectDto.name },
    });

    if (existingProject) {
      throw new ConflictException(`Project with name "${createProjectDto.name}" already exists`);
    }

    const project = this.projectRepository.create(createProjectDto);
    return this.projectRepository.save(project);
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<ProjectEntity> {
    const project = await this.findOne(id);

    // Check if new name conflicts with existing project (if name is being changed)
    if (updateProjectDto.name && updateProjectDto.name !== project.name) {
      const existingProject = await this.projectRepository.findOne({
        where: { name: updateProjectDto.name },
      });

      if (existingProject) {
        throw new ConflictException(`Project with name "${updateProjectDto.name}" already exists`);
      }
    }

    Object.assign(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    
    // Soft delete - set is_active to false instead of actual deletion
    // This preserves data integrity with related posts and categories
    project.is_active = false;
    await this.projectRepository.save(project);
  }

  async hardDelete(id: string): Promise<void> {
    const project = await this.projectRepository.findOne({
      where: { id },
      relations: ['posts', 'categories'],
    });

    if (!project) {
      throw new NotFoundException(`Project with ID "${id}" not found`);
    }

    // Check if project has related data
    const postsCount = await this.projectRepository
      .createQueryBuilder('project')
      .leftJoin('project.posts', 'posts')
      .where('project.id = :id', { id })
      .getCount();

    const categoriesCount = await this.projectRepository
      .createQueryBuilder('project')  
      .leftJoin('project.categories', 'categories')
      .where('project.id = :id', { id })
      .getCount();

    if (postsCount > 0) {
      throw new ConflictException(`Cannot delete project "${project.name}" because it has ${postsCount} posts`);
    }

    if (categoriesCount > 0) {
      throw new ConflictException(`Cannot delete project "${project.name}" because it has ${categoriesCount} categories`);
    }

    await this.projectRepository.remove(project);
  }
} 