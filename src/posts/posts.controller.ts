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
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post as PostInterface } from './interfaces/post.interface'; // PostInterface olarak import ediliyor
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { RequestWithUser } from '../auth/interfaces/request-with-user.interface';

@Controller('posts') // Temel rota: /api/v1/posts
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @PostMethod() // POST /posts
  @UseGuards(JwtAuthGuard, RolesGuard) // Requires authentication and role check
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER) // READ_ONLY cannot create posts
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() createPostDto: CreatePostDto,
    @Req() req: RequestWithUser
  ): Promise<PostInterface> {
    // Add the user ID to the post data
    return this.postsService.create(createPostDto, req.user.id);
  }

  @Get() // GET /posts veya GET /posts?page=1&limit=10&projectIdentifier=our-news&lang=en...
  // Public endpoint - all users can read posts (including READ_ONLY)
  async findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,
    @Query('sort') sort?: string, // örn: title, -createdAt (servis bunu 'createdAt', 'DESC' gibi işleyecek)
    @Query('projectIdentifier') projectIdentifier?: string,
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
    
    return this.postsService.findAll(
      page,
      limit,
      sortField,
      sortOrder,
      projectIdentifier,
      lang,
      category,
      author,
      searchTerm,
      true, // Only show published posts for public endpoint
    );
  }

  @Get('admin/all') // GET /posts/admin/all - Admin endpoint to see all posts (including drafts)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN) // Only SUPER_ADMIN can see all posts including drafts
  async findAllForAdmin(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe)
    limit: number,
    @Query('sort') sort?: string,
    @Query('projectIdentifier') projectIdentifier?: string,
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
    
    return this.postsService.findAll(
      page,
      limit,
      sortField,
      sortOrder,
      projectIdentifier,
      lang,
      category,
      author,
      searchTerm,
      onlyPublished,
    );
  }

  // ID ile getirme (UUID)
  @Get(':id') // GET /posts/some-uuid
  // Public endpoint - all users can read posts (including READ_ONLY)
  async findOneById(@Param('id', ParseUUIDPipe) id: string): Promise<PostInterface> {
    return this.postsService.findOneById(id, false); // Only published posts for public
  }

  // Admin endpoint to get any post by ID (including unpublished)
  @Get('admin/:id') // GET /posts/admin/some-uuid
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN) // Only SUPER_ADMIN can see unpublished posts
  async findOneByIdForAdmin(@Param('id', ParseUUIDPipe) id: string): Promise<PostInterface> {
    return this.postsService.findOneById(id, true); // Include unpublished posts
  }

  // Proje ve Slug ile getirme
  @Get(':projectIdentifier/:slug') // GET /posts/our-news/example-post-slug
  // Public endpoint - all users can read posts (including READ_ONLY)
  async findOneBySlugAndProject(
    @Param('projectIdentifier') projectIdentifier: string,
    @Param('slug') slug: string,
  ): Promise<PostInterface> {
    return this.postsService.findOneBySlugAndProject(projectIdentifier, slug);
  }

  @Patch(':id') // PATCH /posts/some-uuid
  @UseGuards(JwtAuthGuard, RolesGuard) // Requires authentication and role check
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER) // READ_ONLY cannot update posts
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Req() req: RequestWithUser
  ): Promise<PostInterface> {
    return this.postsService.update(id, updatePostDto, req.user.id, req.user.role);
  }

  @Delete(':id') // DELETE /posts/some-uuid
  @UseGuards(JwtAuthGuard, RolesGuard) // Requires authentication and role check
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER) // READ_ONLY cannot delete posts
  @HttpCode(HttpStatus.NO_CONTENT) // Başarılı silme işleminde 204 döner
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser
  ): Promise<void> {
    return this.postsService.remove(id, req.user.id, req.user.role);
  }
}
