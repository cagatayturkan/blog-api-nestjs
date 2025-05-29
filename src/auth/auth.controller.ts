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
  Patch
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto, ValidateResetTokenDto } from './dto/reset-password.dto';
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
    private readonly configService: ConfigService
  ) {}

  // Public endpoints (no authentication required)
  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  @HttpCode(HttpStatus.CREATED)
  @UsePipes(new ValidationPipe({ transform: true }))
  async register(@Body() registerDto: RegisterDto): Promise<Partial<UserEntity>> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async login(@Body() loginDto: LoginDto): Promise<{ access_token: string, refresh_token: string, user: Partial<UserEntity> }> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<{ access_token: string, refresh_token: string }> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset email' })
  @ApiResponse({ status: 200, description: 'Password reset email sent if email exists' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 429, description: 'Too many requests - rate limited' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    return this.passwordResetService.requestPasswordReset(forgotPasswordDto.email);
  }

  @Post('reset-password-with-token')
  @ApiOperation({ summary: 'Reset password using token from email' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async resetPasswordWithToken(@Body() resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    return this.passwordResetService.resetPassword(resetPasswordDto.token, resetPasswordDto.newPassword);
  }

  @Post('validate-reset-token')
  @ApiOperation({ summary: 'Validate password reset token' })
  @ApiResponse({ status: 200, description: 'Token validation result' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async validateResetToken(@Body() validateTokenDto: ValidateResetTokenDto): Promise<{ valid: boolean; email?: string }> {
    return this.passwordResetService.validateResetToken(validateTokenDto.token);
  }

  @Post('logout')
  @ApiOperation({ summary: 'Logout from current device' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async logout(@Body() logoutDto: LogoutDto, @Req() req: RequestWithUser): Promise<{ message: string }> {
    await this.authService.logout(logoutDto, req.user.token);
    return { message: 'Logged out successfully' };
  }

  @Post('logout-all-devices')
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiResponse({ status: 200, description: 'Logged out from all devices successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  async logoutFromAllDevices(@Req() req: RequestWithUser): Promise<{ message: string }> {
    await this.authService.logoutFromAllDevices(req.user.id, req.user.token);
    return { message: 'Logged out from all devices successfully' };
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
          example: 'final_password456'
        },
        newPassword: {
          type: 'string',
          description: 'New password (minimum 8 characters)',
          example: 'new_secure_password789'
        }
      },
      required: ['oldPassword', 'newPassword']
    }
  })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized or invalid current password' })
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async changePasswordAuthenticated(
    @Body() body: { oldPassword: string; newPassword: string },
    @Req() req: RequestWithUser
  ): Promise<{ message: string }> {
    await this.authService.changePassword(req.user.id, body.oldPassword, body.newPassword, req.user.token);
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
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:3000');
    const redirectUrl = `${frontendUrl}/auth/google-callback?token=${authResult.access_token}`;
    
    return res.redirect(redirectUrl);
  }

  // Admin-only endpoints
  @Get('users')
  @ApiOperation({ summary: 'Get all users (Admin only)' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin access required' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async findAllUsers() {
    return this.authService.getAllUsers();
  }

  // Protected endpoints (require authentication)
  @Get('users/:id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER)
  async findUserById(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser
  ) {
    // Users can only access their own profile, admins can access any
    if (req.user.role === UserRole.USER && id !== req.user.id) {
      throw new UnauthorizedException('You can only access your own profile');
    }
    return this.authService.getUserById(id);
  }

  @Get('profile')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: RequestWithUser): Promise<Partial<UserEntity>> {
    // The JWT strategy adds the user info to the request object
    return this.authService.getUserById(req.user.id);
  }

  @Put('users/:id')
  @ApiOperation({ summary: 'Update user information' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: RequestWithUser
  ) {
    // Users can only update their own profile, admins can update any
    if (req.user.role === UserRole.USER && id !== req.user.id) {
      throw new UnauthorizedException('You can only update your own profile');
    }
    return this.authService.updateUser(id, updateUserDto);
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role (Super Admin only)' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiResponse({ status: 200, description: 'User role updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Super Admin access required' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateUserRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserRoleDto: UpdateUserRoleDto
  ): Promise<Partial<UserEntity>> {
    // Only SUPER_ADMIN can change user roles
    // Prevent SUPER_ADMIN from demoting themselves
    return this.authService.updateUserRole(id, updateUserRoleDto.role);
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiResponse({ status: 204, description: 'User deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser
  ): Promise<void> {
    // SUPER_ADMIN can delete any user, others can only delete their own profile
    // Prevent SUPER_ADMIN from deleting themselves
    if (req.user.role === UserRole.SUPER_ADMIN && id === req.user.id) {
      throw new UnauthorizedException('You cannot delete your own admin account');
    }
    if (req.user.role !== UserRole.SUPER_ADMIN && id !== req.user.id) {
      throw new UnauthorizedException('You can only delete your own profile');
    }
    return this.authService.removeUser(id);
  }
} 