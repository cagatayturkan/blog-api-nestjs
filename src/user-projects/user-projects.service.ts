import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProjectEntity } from './entities/user-project.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { ProjectEntity } from '../projects/entities/project.entity';

@Injectable()
export class UserProjectsService {
  constructor(
    @InjectRepository(UserProjectEntity)
    private userProjectRepository: Repository<UserProjectEntity>,
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @InjectRepository(ProjectEntity)
    private projectRepository: Repository<ProjectEntity>,
  ) {}

  async assignUserToProject(userId: string, projectId: string): Promise<UserProjectEntity> {
    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if project exists
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    // Check if assignment already exists
    const existingAssignment = await this.userProjectRepository.findOne({
      where: { user: { id: userId }, project: { id: projectId } },
    });

    if (existingAssignment) {
      throw new ConflictException(`User is already assigned to this project`);
    }

    // Create new assignment
    const assignment = this.userProjectRepository.create({
      user,
      project,
    });

    return this.userProjectRepository.save(assignment);
  }

  async unassignUserFromProject(userId: string, projectId: string): Promise<void> {
    const assignment = await this.userProjectRepository.findOne({
      where: { user: { id: userId }, project: { id: projectId } },
    });

    if (!assignment) {
      throw new NotFoundException(`Assignment not found`);
    }

    await this.userProjectRepository.remove(assignment);
  }

  async getUserProjects(userId: string): Promise<ProjectEntity[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const assignments = await this.userProjectRepository.find({
      where: { user: { id: userId } },
      relations: ['project'],
    });

    return assignments.map(assignment => assignment.project);
  }

  async getProjectUsers(projectId: string): Promise<UserEntity[]> {
    const project = await this.projectRepository.findOne({ where: { id: projectId } });
    if (!project) {
      throw new NotFoundException(`Project with ID ${projectId} not found`);
    }

    const assignments = await this.userProjectRepository.find({
      where: { project: { id: projectId } },
      relations: ['user'],
    });

    return assignments.map(assignment => assignment.user);
  }

  async getAllAssignments(): Promise<UserProjectEntity[]> {
    return this.userProjectRepository.find({
      relations: ['user', 'project'],
    });
  }

  async checkUserHasAccessToProject(userId: string, projectId: string): Promise<boolean> {
    // SUPER_ADMIN has access to all projects
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user?.role === 'SUPER_ADMIN') {
      return true;
    }

    // Check if user is assigned to the project
    const assignment = await this.userProjectRepository.findOne({
      where: { user: { id: userId }, project: { id: projectId } },
    });

    return !!assignment;
  }
} 