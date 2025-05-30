import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProjectEntity } from './entities/user-project.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { ProjectEntity } from '../projects/entities/project.entity';
import { AssignUserToProjectDto } from './dto/assign-user-to-project.dto';

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

  // Helper method to resolve user by ID or email
  private async resolveUser(userId?: string, userEmail?: string): Promise<UserEntity> {
    if (userId && userEmail) {
      throw new BadRequestException('Provide either userId or userEmail, not both');
    }
    
    if (!userId && !userEmail) {
      throw new BadRequestException('Either userId or userEmail must be provided');
    }

    let user: UserEntity | null;
    
    if (userId) {
      user = await this.userRepository.findOne({ where: { id: userId } });
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
    } else {
      user = await this.userRepository.findOne({ where: { email: userEmail } });
      if (!user) {
        throw new NotFoundException(`User with email ${userEmail} not found`);
      }
    }

    return user;
  }

  // Helper method to resolve project by ID or name
  private async resolveProject(projectId?: string, projectName?: string): Promise<ProjectEntity> {
    if (projectId && projectName) {
      throw new BadRequestException('Provide either projectId or projectName, not both');
    }
    
    if (!projectId && !projectName) {
      throw new BadRequestException('Either projectId or projectName must be provided');
    }

    let project: ProjectEntity | null;
    
    if (projectId) {
      project = await this.projectRepository.findOne({ where: { id: projectId } });
      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }
    } else {
      project = await this.projectRepository.findOne({ where: { name: projectName } });
      if (!project) {
        throw new NotFoundException(`Project with name ${projectName} not found`);
      }
    }

    return project;
  }

  // Updated method with flexible identifier support
  async assignUserToProject(assignDto: AssignUserToProjectDto): Promise<UserProjectEntity> {
    // Resolve user and project using flexible identifiers
    const user = await this.resolveUser(assignDto.userId, assignDto.userEmail);
    const project = await this.resolveProject(assignDto.projectId, assignDto.projectName);

    // Check if assignment already exists
    const existingAssignment = await this.userProjectRepository.findOne({
      where: { user: { id: user.id }, project: { id: project.id } },
    });

    if (existingAssignment) {
      throw new ConflictException(`User ${user.email} is already assigned to project ${project.name}`);
    }

    // Create new assignment
    const assignment = this.userProjectRepository.create({
      user,
      project,
    });

    return this.userProjectRepository.save(assignment);
  }

  // Legacy method for backward compatibility (kept for internal use)
  async assignUserToProjectById(userId: string, projectId: string): Promise<UserProjectEntity> {
    return this.assignUserToProject({ userId, projectId });
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