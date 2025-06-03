import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Password reset token received via email',
    example: 'a1b2c3d4-e5f6g7h8-i9j0k1l2m3n4o5p6',
  })
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: 'New password (minimum 8 characters)',
    example: 'newSecurePassword123',
    minLength: 8,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  newPassword: string;
}

export class ValidateResetTokenDto {
  @ApiProperty({
    description: 'Password reset token to validate',
    example: 'a1b2c3d4-e5f6g7h8-i9j0k1l2m3n4o5p6',
  })
  @IsString()
  @IsNotEmpty()
  token: string;
}
