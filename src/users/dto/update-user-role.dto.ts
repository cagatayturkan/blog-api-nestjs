import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../auth/enums/user-role.enum';

export class UpdateUserRoleDto {
  @ApiProperty({
    enum: UserRole,
    description: 'New role for the user',
    example: UserRole.SUPER_ADMIN
  })
  @IsEnum(UserRole)
  role: UserRole;
} 