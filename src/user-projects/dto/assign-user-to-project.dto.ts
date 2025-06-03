import { IsString, IsOptional, IsNotEmpty, ValidateIf } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignUserToProjectDto {
  @ApiProperty({
    description: 'User ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    required: false,
  })
  @IsOptional()
  @IsString()
  @ValidateIf((obj) => !obj.userEmail)
  @IsNotEmpty({ message: 'Either userId or userEmail must be provided' })
  userId?: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsString()
  @ValidateIf((obj) => !obj.userId)
  @IsNotEmpty({ message: 'Either userId or userEmail must be provided' })
  userEmail?: string;

  @ApiProperty({
    description: 'Project name',
    example: 'tech-blog',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  projectName: string;
} 