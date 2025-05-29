import { IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignUserToProjectDto {
  @ApiProperty({
    description: 'User ID to assign to project',
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid'
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Project ID to assign user to',
    example: '987fcdeb-51a2-43d1-9f12-345678901234',
    format: 'uuid'
  })
  @IsUUID()
  @IsNotEmpty()
  projectId: string;
} 