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
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post as PostInterface } from './interfaces/post.interface'; // PostInterface olarak import ediliyor

@Controller('posts') // Temel rota: /api/v1/posts
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @PostMethod() // POST /posts
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createPostDto: CreatePostDto): Promise<PostInterface> {
    return this.postsService.create(createPostDto);
  }

  @Get() // GET /posts veya GET /posts?page=1&limit=10&projectIdentifier=our-news&lang=en...
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
    );
  }

  // ID ile getirme (UUID)
  @Get(':id') // GET /posts/some-uuid
  async findOneById(@Param('id', ParseUUIDPipe) id: string): Promise<PostInterface> {
    return this.postsService.findOneById(id);
  }

  // Proje ve Slug ile getirme
  @Get(':projectIdentifier/:slug') // GET /posts/our-news/example-post-slug
  async findOneBySlugAndProject(
    @Param('projectIdentifier') projectIdentifier: string,
    @Param('slug') slug: string,
  ): Promise<PostInterface> {
    return this.postsService.findOneBySlugAndProject(projectIdentifier, slug);
  }

  @Patch(':id') // PATCH /posts/some-uuid
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<PostInterface> {
    return this.postsService.update(id, updatePostDto);
  }

  @Delete(':id') // DELETE /posts/some-uuid
  @HttpCode(HttpStatus.NO_CONTENT) // Başarılı silme işleminde 204 döner
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.postsService.remove(id);
  }
}
