import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from './entities/project.entity';

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
} 