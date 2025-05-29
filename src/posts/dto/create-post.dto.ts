import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentBlockDto } from './content-block.dto';
import { SeoDataDto } from './seo-data.dto';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({
    description: 'Title of the blog post',
    example: 'Complete Guide to Blog Development'
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Project ID to associate with the post (optional, will be set by middleware)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: false
  })
  @IsOptional()
  @IsUUID()
  projectId?: string; // Optional in DTO, will be set by middleware

  @ApiProperty({
    description: 'URL slug for the post (auto-generated if not provided)',
    example: 'complete-guide-blog-development',
    required: false
  })
  @IsOptional()
  @IsString()
  slug?: string; // Can be auto-generated if omitted

  @ApiProperty({
    description: 'Content blocks that make up the post',
    type: [ContentBlockDto],
    example: [
      {
        order: 0,
        title: 'Introduction',
        content: 'This is the introduction to our blog post about blog development.'
      },
      {
        order: 1,
        title: 'Getting Started',
        content: 'First, let\'s set up our development environment...'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentBlockDto)
  contentBlocks: ContentBlockDto[];

  @ApiProperty({
    description: 'Array of category IDs to associate with the post',
    type: [String],
    example: ['123e4567-e89b-12d3-a456-426614174000', '987fcdeb-51a2-43d1-9f12-345678901234']
  })
  @IsArray()
  @IsUUID('4', { each: true })
  categoryIds: string[];

  @ApiProperty({
    description: 'Array of author names',
    type: [String],
    example: ['John Doe', 'Jane Smith']
  })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  authors: string[]; // In a real app, this might be linked to user IDs

  @ApiProperty({
    description: 'SEO metadata for the post',
    type: SeoDataDto,
    required: false,
    example: {
      title: 'Complete Guide to Blog Development | Tech Blog',
      description: 'Learn how to build a modern blog with NestJS, TypeORM and PostgreSQL.'
    }
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => SeoDataDto)
  seo?: SeoDataDto;

  @ApiProperty({
    description: 'URL of the featured image',
    example: 'https://example.com/images/featured-image.jpg',
    format: 'url',
    required: false
  })
  @IsOptional()
  @IsUrl()
  featuredImage?: string;

  @ApiProperty({
    description: 'Language code for the post',
    example: 'tr',
    enum: ['tr', 'en']
  })
  @IsString()
  @IsNotEmpty()
  language: string; // e.g., 'en', 'tr'

  @ApiProperty({
    description: 'Whether the post is published or draft',
    example: true,
    default: false,
    required: false
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean; // Optional, defaults to false (draft)

  // userId is typically handled by the authentication system, not passed in DTO
  // createdAt and updatedAt are handled by the service/database
} 