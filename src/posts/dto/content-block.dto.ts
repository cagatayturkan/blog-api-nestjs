import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ContentBlockDto {
  @ApiProperty({
    description: 'Order of the content block in the post',
    example: 0,
    minimum: 0
  })
  @IsInt()
  @Min(0)
  order: number;

  @ApiProperty({
    description: 'Optional title for the content block',
    example: 'Introduction',
    required: false
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Content of the block (HTML or markdown)',
    example: 'This is the main content of the blog post. It can contain **markdown** or HTML.'
  })
  @IsString()
  @IsNotEmpty()
  content: string;
} 