import { IsUUID, IsNotEmpty, IsOptional, IsEmail, ValidateIf, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignUserToProjectDto {
  // User can be identified by either ID or email
  @ApiProperty({
    description: 'User ID to assign to project (UUID format)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
    required: false
  })
  @IsOptional()
  @IsUUID()
  @ValidateIf((o) => !o.userEmail) // Required if userEmail is not provided
  userId?: string;

  @ApiProperty({
    description: 'User email to assign to project (alternative to userId)',
    example: 'john.doe@example.com',
    format: 'email',
    required: false
  })
  @IsOptional()
  @IsEmail()
  @ValidateIf((o) => !o.userId) // Required if userId is not provided
  userEmail?: string;

  // Project can be identified by either ID or name
  @ApiProperty({
    description: 'Project ID to assign user to (UUID format)',
    example: '987fcdeb-51a2-43d1-9f12-345678901234',
    format: 'uuid',
    required: false
  })
  @IsOptional()
  @IsUUID()
  @ValidateIf((o) => !o.projectName) // Required if projectName is not provided
  projectId?: string;

  @ApiProperty({
    description: 'Project name to assign user to (alternative to projectId)',
    example: 'tech-blog',
    required: false
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ValidateIf((o) => !o.projectId) // Required if projectId is not provided
  projectName?: string;
} 