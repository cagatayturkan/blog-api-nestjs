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
  Res
} from '@nestjs/common';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { AuthService } from './auth.service';
import { UserEntity } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
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
  async login(@Body() loginDto: LoginDto): Promise<{ access_token: string, user: Partial<UserEntity> }> {
    return this.authService.login(loginDto);
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

  // Protected endpoints (require authentication)
  @Get('users/:id')
  @UseGuards(JwtAuthGuard)
  async getUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser
  ): Promise<Partial<UserEntity>> {
    // Users can now view any profile by ID if authenticated
    return this.authService.getUserById(id);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: RequestWithUser): Promise<Partial<UserEntity>> {
    // The JWT strategy adds the user info to the request object
    return this.authService.getUserById(req.user.id);
  }

  @Put('users/:id')
  @UseGuards(JwtAuthGuard)
  @UsePipes(new ValidationPipe({ transform: true }))
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: RequestWithUser
  ): Promise<Partial<UserEntity>> {
    // Ensure users can only update their own profile
    if (id !== req.user.id) {
      throw new UnauthorizedException('You can only update your own profile');
    }
    return this.authService.updateUser(id, updateUserDto);
  }

  @Delete('users/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser
  ): Promise<void> {
    // Ensure users can only delete their own profile
    if (id !== req.user.id) {
      throw new UnauthorizedException('You can only delete your own profile');
    }
    return this.authService.removeUser(id);
  }
} 