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
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { LogoutDto } from './dto/logout.dto';
import { AuthService } from './auth.service';
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

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService
  ) {}

  // Public endpoints (no authentication required)
  @Post('register')
  @UsePipes(new ValidationPipe({ transform: true }))
  async register(@Body() registerDto: RegisterDto): Promise<Partial<UserEntity>> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async login(@Body() loginDto: LoginDto): Promise<{ access_token: string, refresh_token: string, user: Partial<UserEntity> }> {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<{ access_token: string, refresh_token: string }> {
    return this.authService.refreshToken(refreshTokenDto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @UsePipes(new ValidationPipe({ transform: true }))
  async logout(@Body() logoutDto: LogoutDto): Promise<{ message: string }> {
    await this.authService.logout(logoutDto);
    return { message: 'Logged out successfully' };
  }

  // Google Authentication routes
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // This route initiates Google OAuth2 flow
    // The actual implementation is handled by Passport
  }

  @Get('google/callback')
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
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async getAllUsers(): Promise<Partial<UserEntity>[]> {
    return this.authService.getAllUsers();
  }

  // Protected endpoints (require authentication)
  @Get('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER)
  async getUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser
  ): Promise<Partial<UserEntity>> {
    // SUPER_ADMIN can view any user, others can only view their own profile
    if (req.user.role !== UserRole.SUPER_ADMIN && id !== req.user.id) {
      throw new UnauthorizedException('You can only view your own profile');
    }
    return this.authService.getUserById(id);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: RequestWithUser): Promise<Partial<UserEntity>> {
    // The JWT strategy adds the user info to the request object
    return this.authService.getUserById(req.user.id);
  }

  @Put('users/:id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.USER)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: RequestWithUser
  ): Promise<Partial<UserEntity>> {
    // SUPER_ADMIN can update any user, others can only update their own profile
    if (req.user.role !== UserRole.SUPER_ADMIN && id !== req.user.id) {
      throw new UnauthorizedException('You can only update your own profile');
    }
    return this.authService.updateUser(id, updateUserDto);
  }

  @Patch('users/:id/role')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateUserRole(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { role: UserRole },
    @Req() req: RequestWithUser
  ): Promise<Partial<UserEntity>> {
    // Only SUPER_ADMIN can change user roles
    // Prevent SUPER_ADMIN from demoting themselves
    if (id === req.user.id) {
      throw new UnauthorizedException('You cannot change your own role');
    }
    return this.authService.updateUserRole(id, body.role);
  }

  @Delete('users/:id')
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