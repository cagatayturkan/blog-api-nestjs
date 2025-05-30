import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Query,
  UsePipes,
  ValidationPipe,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody, ApiHeader } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { UserProjectsService } from '../user-projects/user-projects.service';
import { CreateCategoryDto, CreateCategoryWithProjectDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { RequestWithProject } from '../common/middleware/project-filter.middleware';

// Combine both request interfaces
interface RequestWithUserAndProject extends RequestWithProject {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly userProjectsService: UserProjectsService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category' })
  @ApiHeader({
    name: 'projectname',
    description: 'Project name to create category in',
    required: true,
    example: 'tech-blog'
  })
  @ApiBody({
    description: 'Category creation data',
    schema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Category name',
          example: 'Technology'
        },
        slug: {
          type: 'string',
          description: 'Category URL slug (optional)',
          example: 'technology'
        },
        description: {
          type: 'string',
          description: 'Category description (optional)',
          example: 'Articles about technology and innovation'
        }
      },
      required: ['name']
    }
  })
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER) // READ_ONLY cannot create categories
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: { name: string; slug?: string; description?: string },
    @Req() req: RequestWithUserAndProject
  ) {
    // Create internal DTO with project ID from middleware
    const createCategoryWithProject: CreateCategoryWithProjectDto = {
      name: body.name,
      slug: body.slug,
      description: body.description,
      projectId: req.project!.id,
    };
    
    return this.categoriesService.create(createCategoryWithProject, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiHeader({
    name: 'projectname',
    description: 'Project name to get categories from',
    required: true,
    example: 'tech-blog'
  })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard) // Requires authentication
  async findAllByProject(
    @Req() req: RequestWithUserAndProject,
  ) {
    // Check if user has access to this project
    const hasAccess = await this.userProjectsService.checkUserHasAccessToProject(req.user.id, req.project!.id);
    if (!hasAccess) {
      throw new ForbiddenException(`You don't have access to project "${req.project!.name}"`);
    }
    
    return this.categoriesService.findAllByProject(req.project!.id, req.user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUserAndProject
  ) {
    return this.categoriesService.findOne(id, req.user.id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update category' })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER) // READ_ONLY cannot update categories
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Req() req: RequestWithUserAndProject
  ) {
    return this.categoriesService.update(id, updateCategoryDto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category' })
  @ApiParam({
    name: 'id',
    description: 'Category ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 204, description: 'Category deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - insufficient permissions' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER) // READ_ONLY cannot delete categories
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUserAndProject
  ): Promise<void> {
    return this.categoriesService.remove(id, req.user.id, req.user.role);
  }
} 