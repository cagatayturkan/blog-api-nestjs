import { PartialType } from '@nestjs/mapped-types';
import { CreateCategoryDto } from './create-category.dto';
import { IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {
  @ApiProperty({
    description: 'Project ID to move category to (admin only)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: false
  })
  @IsOptional()
  @IsUUID()
  projectId?: string; // Allow changing project (admin only)
} 