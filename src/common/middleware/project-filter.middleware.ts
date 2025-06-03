import {
  Injectable,
  NestMiddleware,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProjectEntity } from '../../projects/entities/project.entity';

// Extend Express Request to include project information
export interface RequestWithProject extends Request {
  project?: {
    id: string;
    name: string;
  };
}

@Injectable()
export class ProjectFilterMiddleware implements NestMiddleware {
  constructor(
    @InjectRepository(ProjectEntity)
    private projectRepository: Repository<ProjectEntity>,
  ) {}

  async use(req: RequestWithProject, res: Response, next: NextFunction) {
    // Check for projectName header
    const projectName = req.headers['projectname'] as string;

    if (!projectName) {
      throw new BadRequestException({
        message: 'Project name is required in header',
        error: 'MISSING_PROJECT_HEADER',
        statusCode: 400,
        details: 'Please provide "projectName" header with your request',
      });
    }

    // Validate project exists and is active
    const project = await this.projectRepository.findOne({
      where: {
        name: projectName,
        is_active: true,
      },
    });

    if (!project) {
      throw new NotFoundException({
        message: `Project "${projectName}" not found or inactive`,
        error: 'PROJECT_NOT_FOUND',
        statusCode: 404,
        details: `The project "${projectName}" does not exist or has been deactivated`,
      });
    }

    // Add project info to request object for use in controllers/services
    req.project = {
      id: project.id,
      name: project.name,
    };

    next();
  }
}
