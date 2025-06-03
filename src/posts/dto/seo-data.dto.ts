import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SeoDataDto {
  @ApiProperty({
    description: 'SEO title for the post',
    example: 'Complete Guide to Blog Development | Tech Blog',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'SEO meta description for the post',
    example:
      'Learn how to build a modern blog with NestJS, TypeORM and PostgreSQL. Complete tutorial with authentication and JWT.',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
