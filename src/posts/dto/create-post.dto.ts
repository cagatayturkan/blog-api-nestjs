import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ContentBlockDto } from './content-block.dto';
import { SeoDataDto } from './seo-data.dto';

export class CreatePostDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  projectIdentifier: string;

  @IsOptional()
  @IsString()
  slug?: string; // Can be auto-generated if omitted

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContentBlockDto)
  contentBlocks: ContentBlockDto[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  categories: string[];

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  authors: string[]; // In a real app, this might be linked to user IDs

  @IsOptional()
  @ValidateNested()
  @Type(() => SeoDataDto)
  seo?: SeoDataDto;

  @IsOptional()
  @IsUrl()
  featuredImage?: string;

  @IsString()
  @IsNotEmpty()
  language: string; // e.g., 'en', 'tr'

  @IsOptional()
  @IsBoolean()
  isPublished?: boolean; // Optional, defaults to false (draft)

  // userId is typically handled by the authentication system, not passed in DTO
  // createdAt and updatedAt are handled by the service/database
} 