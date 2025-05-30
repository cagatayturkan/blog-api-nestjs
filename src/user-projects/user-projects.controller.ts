import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UserProjectsService } from './user-projects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { AssignUserToProjectDto } from './dto/assign-user-to-project.dto';

@ApiTags('User-Projects')
@Controller('user-projects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class UserProjectsController {
  constructor(private readonly userProjectsService: UserProjectsService) {}

  @Post('assign')
  @ApiOperation({ 
    summary: 'Assign user to project (Super Admin only)',
    description: 'Assign a user to a project using either ID or human-readable identifiers (email/project name)'
  })
  @ApiResponse({ status: 201, description: 'User assigned to project successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input or conflicting identifiers' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin access required' })
  @ApiResponse({ status: 404, description: 'User or project not found' })
  @ApiResponse({ status: 409, description: 'User already assigned to project' })
  @Roles(UserRole.SUPER_ADMIN) // Only SUPER_ADMIN can assign users to projects
  @HttpCode(HttpStatus.CREATED)
  async assignUserToProject(@Body() assignDto: AssignUserToProjectDto) {
    return this.userProjectsService.assignUserToProject(assignDto);
  }

  @Delete('unassign/:userId/:projectId')
  @ApiOperation({ summary: 'Unassign user from project (Super Admin only)' })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiParam({
    name: 'projectId',
    description: 'Project ID',
    example: '987fcdeb-51a2-43d1-9f12-345678901234'
  })
  @ApiResponse({ status: 204, description: 'User unassigned from project successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin access required' })
  @ApiResponse({ status: 404, description: 'Assignment not found' })
  @Roles(UserRole.SUPER_ADMIN) // Only SUPER_ADMIN can unassign users from projects
  @HttpCode(HttpStatus.NO_CONTENT)
  async unassignUserFromProject(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('projectId', ParseUUIDPipe) projectId: string,
  ): Promise<void> {
    return this.userProjectsService.unassignUserFromProject(userId, projectId);
  }

  @Get('user/:userId/projects')
  @ApiOperation({ summary: 'Get all projects assigned to a user (Super Admin only)' })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ status: 200, description: 'User projects retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin access required' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Roles(UserRole.SUPER_ADMIN) // Only SUPER_ADMIN can view user assignments
  async getUserProjects(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.userProjectsService.getUserProjects(userId);
  }

  @Get('project/:projectId/users')
  @ApiOperation({ summary: 'Get all users assigned to a project (Super Admin only)' })
  @ApiParam({
    name: 'projectId',
    description: 'Project ID',
    example: '987fcdeb-51a2-43d1-9f12-345678901234'
  })
  @ApiResponse({ status: 200, description: 'Project users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin access required' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @Roles(UserRole.SUPER_ADMIN) // Only SUPER_ADMIN can view project assignments
  async getProjectUsers(@Param('projectId', ParseUUIDPipe) projectId: string) {
    return this.userProjectsService.getProjectUsers(projectId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all user-project assignments (Super Admin only)' })
  @ApiResponse({ status: 200, description: 'All assignments retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin access required' })
  @Roles(UserRole.SUPER_ADMIN) // Only SUPER_ADMIN can view all assignments
  async getAllAssignments() {
    return this.userProjectsService.getAllAssignments();
  }
} 