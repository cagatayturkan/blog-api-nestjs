import {
  Controller,
  Get,
  Post as PostMethod,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseIntPipe,
  UseGuards,
  Req,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiHeader,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { UserProjectsService } from '../user-projects/user-projects.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post as PostInterface } from './interfaces/post.interface'; // PostInterface olarak import ediliyor
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { RequestWithProject } from '../common/middleware/project-filter.middleware';

// Combine both request interfaces properly
interface RequestWithUserAndProject extends RequestWithProject {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@ApiTags('Posts')
@Controller('posts') // Temel rota: /api/v1/posts
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly userProjectsService: UserProjectsService,
  ) {}

  @PostMethod() // POST /posts
  @ApiOperation({ summary: 'Create a new blog post' })
  @ApiHeader({
    name: 'projectname',
    description: 'Project name to create post in',
    required: true,
    example: 'tech-blog',
  })
  @ApiResponse({ status: 201, description: 'Post created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard) // Requires authentication and role check
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER) // READ_ONLY cannot create posts
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createPostDto: CreatePostDto,
    @Req() req: RequestWithUserAndProject,
  ): Promise<PostInterface> {
    // Use project ID from middleware instead of DTO
    const createPostDtoWithProject = {
      ...createPostDto,
      projectId: req.project!.id, // Override with project from header
    };

    return this.postsService.create(createPostDtoWithProject, req.user.id);
  }

  @Get() // GET /posts
  @ApiOperation({ summary: 'Get all posts (public endpoint)' })
  @ApiHeader({
    name: 'projectname',
    description: 'Project name to get posts from',
    required: true,
    example: 'tech-blog',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    required: false,
    example: 10,
  })
  @ApiQuery({
    name: 'sort',
    description: 'Sort field (prefix with - for DESC)',
    required: false,
    example: '-created_at',
  })
  @ApiQuery({
    name: 'lang',
    description: 'Language filter',
    required: false,
    example: 'tr',
  })
  @ApiQuery({
    name: 'category',
    description: 'Category filter',
    required: false,
  })
  @ApiQuery({ name: 'author', description: 'Author filter', required: false })
  @ApiQuery({
    name: 'searchTerm',
    description: 'Search in title',
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Posts retrieved successfully' })
  // Public endpoint - all users can read published posts
  async findAll(
    @Req() req: RequestWithProject,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,
    @Query('sort') sort?: string,
    @Query('lang') lang?: string,
    @Query('category') category?: string,
    @Query('author') author?: string,
    @Query('searchTerm') searchTerm?: string,
  ): Promise<{ data: PostInterface[]; pagination: any }> {
    let sortField = 'created_at';
    let sortOrder: 'ASC' | 'DESC' = 'DESC';

    if (sort) {
      sortOrder = sort.startsWith('-') ? 'DESC' : 'ASC';
      sortField = sort.startsWith('-') ? sort.substring(1) : sort;
    }

    // Use project name from middleware
    return this.postsService.findAll(
      page,
      limit,
      sortField,
      sortOrder,
      req.project!.name, // Use project from header
      lang,
      category,
      author,
      searchTerm,
      true, // Only show published posts for public access
    );
  }

  @Get('admin/all') // GET /posts/admin/all - Admin endpoint to see all posts (including drafts)
  @ApiOperation({
    summary: 'Get all posts including drafts (Super Admin only)',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number',
    required: false,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Items per page',
    required: false,
    example: 10,
  })
  @ApiQuery({
    name: 'sort',
    description: 'Sort field (prefix with - for DESC)',
    required: false,
    example: '-created_at',
  })
  @ApiQuery({
    name: 'lang',
    description: 'Language filter',
    required: false,
    example: 'tr',
  })
  @ApiQuery({
    name: 'category',
    description: 'Category filter',
    required: false,
  })
  @ApiQuery({ name: 'author', description: 'Author filter', required: false })
  @ApiQuery({
    name: 'searchTerm',
    description: 'Search in title',
    required: false,
  })
  @ApiQuery({
    name: 'includeUnpublished',
    description: 'Include unpublished posts',
    required: false,
    example: 'true',
  })
  @ApiResponse({ status: 200, description: 'Posts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin access required',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN) // Only SUPER_ADMIN can see all posts including drafts
  async findAllForAdmin(
    @Req() req: RequestWithProject,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,
    @Query('sort') sort?: string,
    @Query('lang') lang?: string,
    @Query('category') category?: string,
    @Query('author') author?: string,
    @Query('searchTerm') searchTerm?: string,
    @Query('includeUnpublished') includeUnpublished?: string,
  ): Promise<{ data: PostInterface[]; pagination: any }> {
    let sortField = 'created_at';
    let sortOrder: 'ASC' | 'DESC' = 'DESC';

    if (sort) {
      sortOrder = sort.startsWith('-') ? 'DESC' : 'ASC';
      sortField = sort.startsWith('-') ? sort.substring(1) : sort;
    }

    const onlyPublished = includeUnpublished !== 'true'; // Admin can choose to include unpublished

    // Use project name from middleware
    return this.postsService.findAll(
      page,
      limit,
      sortField,
      sortOrder,
      req.project!.name, // Use project from header
      lang,
      category,
      author,
      searchTerm,
      onlyPublished,
    );
  }

  // ID ile getirme (UUID)
  @Get(':id') // GET /posts/some-uuid
  @ApiOperation({ summary: 'Get post by ID (public endpoint)' })
  @ApiParam({
    name: 'id',
    description: 'Post ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'Post retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  // Public endpoint - all users can read posts (including READ_ONLY)
  async findOneById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithProject,
  ): Promise<PostInterface> {
    // Verify the post belongs to the current project
    const post = await this.postsService.findOneById(id, false);
    if (post.projectId !== req.project!.id) {
      throw new NotFoundException(
        `Post not found in project "${req.project!.name}"`,
      );
    }
    return post;
  }

  // Admin endpoint to get any post by ID (including unpublished)
  @Get('admin/:id') // GET /posts/admin/some-uuid
  @ApiOperation({
    summary: 'Get post by ID including unpublished (Super Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Post ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'Post retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Super Admin access required',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN) // Only SUPER_ADMIN can see unpublished posts
  async findOneByIdForAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithProject,
  ): Promise<PostInterface> {
    // Verify the post belongs to the current project
    const post = await this.postsService.findOneById(id, true);
    if (post.projectId !== req.project!.id) {
      throw new NotFoundException(
        `Post not found in project "${req.project!.name}"`,
      );
    }
    return post;
  }

  // Slug ile getirme (project artık header'dan geliyor)
  @Get('slug/:slug') // GET /posts/slug/example-post-slug
  @ApiOperation({ summary: 'Get post by slug (public endpoint)' })
  @ApiParam({
    name: 'slug',
    description: 'Post URL slug',
    example: 'complete-guide-blog-development',
  })
  @ApiResponse({ status: 200, description: 'Post retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  // Public endpoint - all users can read posts (including READ_ONLY)
  async findOneBySlug(
    @Param('slug') slug: string,
    @Req() req: RequestWithProject,
  ): Promise<PostInterface> {
    return this.postsService.findOneBySlugAndProject(req.project!.name, slug);
  }

  @Patch(':id') // PATCH /posts/some-uuid
  @ApiOperation({ summary: 'Update post' })
  @ApiParam({
    name: 'id',
    description: 'Post ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 200, description: 'Post updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard) // Requires authentication and role check
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER) // READ_ONLY cannot update posts
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Req() req: RequestWithUserAndProject,
  ): Promise<PostInterface> {
    // Verify the post belongs to the current project before updating
    const existingPost = await this.postsService.findOneById(id, true);
    if (existingPost.projectId !== req.project!.id) {
      throw new NotFoundException(
        `Post not found in project "${req.project!.name}"`,
      );
    }

    return this.postsService.update(
      id,
      updatePostDto,
      req.user.id,
      req.user.role,
    );
  }

  @Delete(':id') // DELETE /posts/some-uuid
  @ApiOperation({ summary: 'Delete post' })
  @ApiParam({
    name: 'id',
    description: 'Post ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({ status: 204, description: 'Post deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard) // Requires authentication and role check
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER) // READ_ONLY cannot delete posts
  @HttpCode(HttpStatus.NO_CONTENT) // Başarılı silme işleminde 204 döner
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUserAndProject,
  ): Promise<void> {
    // Verify the post belongs to the current project before deleting
    const existingPost = await this.postsService.findOneById(id, true);
    if (existingPost.projectId !== req.project!.id) {
      throw new NotFoundException(
        `Post not found in project "${req.project!.name}"`,
      );
    }

    return this.postsService.remove(id, req.user.id, req.user.role);
  }
}
