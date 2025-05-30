import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all active projects (public endpoint)' })
  @ApiResponse({ 
    status: 200, 
    description: 'Projects retrieved successfully',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '123e4567-e89b-12d3-a456-426614174000'
          },
          name: {
            type: 'string',
            example: 'tech-blog'
          },
          url: {
            type: 'string',
            example: 'https://tech-blog.example.com'
          },
          description: {
            type: 'string',
            example: 'Technology blog project'
          },
          is_active: {
            type: 'boolean',
            example: true
          },
          created_at: {
            type: 'string',
            format: 'date-time'
          },
          updated_at: {
            type: 'string',
            format: 'date-time'
          }
        }
      }
    }
  })
  // Public endpoint - all users can see active projects
  async findAll() {
    return this.projectsService.findAll();
  }
} 