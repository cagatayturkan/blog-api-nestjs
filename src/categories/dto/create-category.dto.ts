import { IsString, IsNotEmpty, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Technology',
    minLength: 1,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Category URL slug (auto-generated if not provided)',
    example: 'technology',
    required: false,
  })
  @IsOptional()
  @IsString()
  slug?: string; // Can be auto-generated if omitted

  @ApiProperty({
    description: 'Category description',
    example: 'Articles about technology and innovation',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}

// Internal DTO with projectId for service use
export class CreateCategoryWithProjectDto extends CreateCategoryDto {
  @ApiProperty({
    description: 'Project ID to associate with category',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string; // Required for service
}
