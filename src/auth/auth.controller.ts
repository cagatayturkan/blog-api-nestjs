import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  UsePipes,
  HttpStatus,
  HttpCode,
  Get,
  Param,
  Put,
  Delete,
  ParseUUIDPipe,
  UseGuards,
  Req,
  UnauthorizedException,
  Res,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import {
  ResetPasswordDto,
  ValidateResetTokenDto,
} from './dto/reset-password.dto';
import { AuthService } from './auth.service';
import { PasswordResetService } from './services/password-reset.service';
import { UserEntity } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './decorators/roles.decorator';
import { UserRole } from './enums/user-role.enum';
import { RequestWithUser } from './interfaces/request-with-user.interface';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { UpdateUserRoleDto } from '../users/dto/update-user-role.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
    private readonly configService: ConfigService,
  ) {}

  // Public endpoints (no authentication required)
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<Partial<UserEntity>> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ access_token: string; user: Partial<UserEntity> }> {
    return this.authService.login(loginDto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent if email exists',
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limited' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return this.passwordResetService.requestPasswordReset(
      forgotPasswordDto.email,
    );
  }

  @Post('reset-password-with-token')
  @ApiOperation({ summary: 'Reset password using token from email' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async resetPasswordWithToken(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return this.passwordResetService.resetPassword(
      resetPasswordDto.token,
      resetPasswordDto.newPassword,
    );
  }

  @Post('validate-reset-token')
  @ApiOperation({ summary: 'Validate password reset token' })
  @ApiResponse({ status: 200, description: 'Token validation result' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async validateResetToken(
    @Body() validateTokenDto: ValidateResetTokenDto,
  ): Promise<{ valid: boolean; email?: string }> {
    return this.passwordResetService.validateResetToken(validateTokenDto.token);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout from current device' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logout(@Req() req: RequestWithUser): Promise<{ message: string }> {
    await this.authService.logout(req.user.sessionId);
    return { message: 'Logged out successfully' };
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change password (authenticated user)' })
  @ApiBody({
    description: 'Password change request',
    schema: {
      type: 'object',
      properties: {
        oldPassword: {
          type: 'string',
          description: 'Current password',
          example: 'final_password456',
        },
        newPassword: {
          type: 'string',
          description: 'New password (minimum 8 characters)',
          example: 'new_secure_password789',
        },
      },
      required: ['oldPassword', 'newPassword'],
    },
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized or invalid current password',
  })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async changePassword(
    @Body() body: { oldPassword: string; newPassword: string },
    @Req() req: RequestWithUser,
  ): Promise<{ message: string }> {
    await this.authService.changePassword(
      req.user.id,
      body.oldPassword,
      body.newPassword,
    );
    return { message: 'Password changed successfully. Please login again.' };
  }

  // Google Authentication routes
  @Get('google')
  @ApiOperation({ summary: 'Google OAuth login' })
  @ApiResponse({ status: 302, description: 'Redirect to Google OAuth' })
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // This route initiates Google OAuth2 flow
    // The actual implementation is handled by Passport
  }

  @Get('google/callback')
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 200, description: 'Google OAuth successful' })
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Req() req: any, @Res() res: Response) {
    // After successful Google authentication, the user is redirected here
    const authResult = await this.authService.googleLogin(req.user);

    // Redirect to frontend with token in query params
    const frontendUrl = this.configService.get<string>(
      'FRONTEND_URL',
      'http://localhost:3000',
    );
    const redirectUrl = `${frontendUrl}/auth/google-callback?token=${authResult.access_token}`;

    return res.redirect(redirectUrl);
  }

  // Admin-only endpoints
  @Get('users')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'List of all users' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async findAllUsers() {
    return this.authService.getAllUsers();
  }

  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID (Admin or own profile)' })
  @ApiParam({ name: 'id', description: 'User UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'User details' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only access own profile or admin required',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async findUserById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ) {
    // Users can only access their own profile unless they're admin
    if (req.user.id !== id && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('You can only access your own profile');
    }
    return this.authService.getUserById(id);
  }

  // Protected endpoints (require authentication)
  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: RequestWithUser): Promise<Partial<UserEntity>> {
    return this.authService.getUserById(req.user.id);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user (Admin or own profile)' })
  @ApiParam({ name: 'id', description: 'User UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Can only update own profile or admin required',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: RequestWithUser,
  ) {
    // Users can only update their own profile unless they're admin
    if (req.user.id !== id && req.user.role !== UserRole.SUPER_ADMIN) {
      throw new UnauthorizedException('You can only update your own profile');
    }
    return this.authService.updateUser(id, updateUserDto);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role (Admin only)' })
  @ApiParam({ name: 'id', description: 'User UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async updateUserRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto,
  ): Promise<Partial<UserEntity>> {
    return this.authService.updateUserRole(id, updateUserRoleDto.role);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  @ApiParam({ name: 'id', description: 'User UUID', type: 'string' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Admin access required',
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser,
  ): Promise<void> {
    // Prevent admin from deleting themselves
    if (req.user.id === id) {
      throw new UnauthorizedException('You cannot delete your own account');
    }
    await this.authService.removeUser(id);
  }
}
