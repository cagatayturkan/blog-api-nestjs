import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../auth/entities/user.entity';
import { ProjectEntity } from '../projects/entities/project.entity';
import { UserRepository } from '../auth/repositories/user.repository';
import { AssignUserToProjectDto } from './dto/assign-user-to-project.dto';

@Injectable()
export class UserProjectsService {
  constructor(
    private readonly userRepository: UserRepository,
    @InjectRepository(ProjectEntity)
    private projectRepository: Repository<ProjectEntity>,
  ) {}

  // Helper method to resolve user by ID or email
  private async resolveUser(
    userId?: string,
    userEmail?: string,
  ): Promise<UserEntity> {
    if (userId && userEmail) {
      throw new BadRequestException(
        'Provide either userId or userEmail, not both',
      );
    }

    if (!userId && !userEmail) {
      throw new BadRequestException(
        'Either userId or userEmail must be provided',
      );
    }

    let user: UserEntity | null;

    if (userId) {
      user = await this.userRepository.findById(userId);
      if (!user) {
        throw new NotFoundException(`User with ID ${userId} not found`);
      }
    } else {
      user = await this.userRepository.findByEmail(userEmail!);
      if (!user) {
        throw new NotFoundException(`User with email ${userEmail} not found`);
      }
    }

    return user;
  }

  // Helper method to resolve project by ID or name
  private async resolveProject(
    projectId?: string,
    projectName?: string,
  ): Promise<ProjectEntity> {
    if (projectId && projectName) {
      throw new BadRequestException(
        'Provide either projectId or projectName, not both',
      );
    }

    if (!projectId && !projectName) {
      throw new BadRequestException(
        'Either projectId or projectName must be provided',
      );
    }

    let project: ProjectEntity | null;

    if (projectId) {
      project = await this.projectRepository.findOne({
        where: { id: projectId },
      });
      if (!project) {
        throw new NotFoundException(`Project with ID ${projectId} not found`);
      }
    } else {
      project = await this.projectRepository.findOne({
        where: { name: projectName },
      });
      if (!project) {
        throw new NotFoundException(
          `Project with name ${projectName} not found`,
        );
      }
    }

    return project;
  }

  async assignUserToProject(
    assignDto: AssignUserToProjectDto,
  ): Promise<{ message: string; user: Partial<UserEntity> }> {
    // Resolve user and project using flexible identifiers
    const user = await this.resolveUser(assignDto.userId, assignDto.userEmail);
    const project = await this.resolveProject(undefined, assignDto.projectName);

    // Check if assignment already exists
    if (user.projects.includes(project.name)) {
      throw new ConflictException(
        `User ${user.email} is already assigned to project ${project.name}`,
      );
    }

    // Add project to user
    const updatedUser = await this.userRepository.addProjectToUser(
      user.id,
      project.name,
    );
    if (!updatedUser) {
      throw new NotFoundException('Failed to assign user to project');
    }

    // Remove sensitive data
    const { password, ...userResponse } = updatedUser;

    return {
      message: `User ${user.email} assigned to project ${project.name} successfully`,
      user: userResponse,
    };
  }

  async unassignUserFromProject(
    userId: string,
    projectName: string,
  ): Promise<{ message: string }> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (!user.projects.includes(projectName)) {
      throw new NotFoundException(
        `User is not assigned to project ${projectName}`,
      );
    }

    await this.userRepository.removeProjectFromUser(userId, projectName);

    return {
      message: `User unassigned from project ${projectName} successfully`,
    };
  }

  async getUserProjects(userId: string): Promise<string[]> {
    const projects = await this.userRepository.getUserProjects(userId);
    return projects;
  }

  async getProjectUsers(projectName: string): Promise<UserEntity[]> {
    // Verify project exists
    const project = await this.projectRepository.findOne({
      where: { name: projectName },
    });
    if (!project) {
      throw new NotFoundException(`Project with name ${projectName} not found`);
    }

    const users = await this.userRepository.getUsersByProject(projectName);

    // Remove sensitive data
    return users.map((user) => {
      const { password, ...userWithoutSensitiveData } = user;
      return userWithoutSensitiveData as UserEntity;
    });
  }

  async getAllAssignments(): Promise<
    { userId: string; email: string; projects: string[] }[]
  > {
    const users = await this.userRepository.findAll();

    return users
      .filter((user) => user.projects.length > 0)
      .map((user) => ({
        userId: user.id,
        email: user.email,
        projects: user.projects,
      }));
  }

  async checkUserHasAccessToProject(
    userId: string,
    projectName: string,
  ): Promise<boolean> {
    return this.userRepository.checkUserHasAccessToProject(userId, projectName);
  }
}
