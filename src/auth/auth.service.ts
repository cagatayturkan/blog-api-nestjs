import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRepository, GoogleUserDto } from './repositories/user.repository';
import { UserEntity } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './enums/user-role.enum';
import { SessionService } from './services/session.service';
import { MailService } from './services/mail.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly sessionService: SessionService,
    private readonly mailService: MailService,
  ) {}

  async register(registerDto: RegisterDto): Promise<Partial<UserEntity>> {
    // Check if user with this email already exists
    const existingUser = await this.userRepository.findByEmail(
      registerDto.email,
    );
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create new user - password hashing is done in UserEntity @BeforeInsert
    const user = await this.userRepository.create(registerDto);

    // Send welcome email (don't block registration if email fails)
    try {
      await this.mailService.sendWelcomeEmail(user.email, user.first_name);
    } catch (error) {
      console.warn('Failed to send welcome email:', error.message);
    }

    // Don't return the password in the response
    const { password, ...result } = user;
    return result;
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ access_token: string; user: Partial<UserEntity> }> {
    // Find the user with the provided email
    const user = await this.userRepository.findByEmail(loginDto.email);

    // Check if user exists and password matches
    if (!user || !(await user.validatePassword(loginDto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check email verification if required
    const requireEmailVerificationRaw = this.configService.get<string>(
      'REQUIRE_EMAIL_VERIFICATION',
      'false',
    );
    const requireEmailVerification = requireEmailVerificationRaw === 'true';

    if (requireEmailVerification && !user.is_email_verified) {
      throw new UnauthorizedException(
        'Email verification required. Please verify your email address before logging in.',
      );
    }

    // Create session
    const sessionId = await this.sessionService.createSession(user.id);

    // Generate JWT with session ID
    const payload = {
      email: user.email,
      sub: user.id,
      sessionId: sessionId, // Add session ID to JWT payload
    };

    const accessToken = this.jwtService.sign(payload);

    // Don't include password in the response
    const { password, ...result } = user;

    return {
      access_token: accessToken,
      user: result,
    };
  }

  async googleLogin(
    googleUser: any,
  ): Promise<{ access_token: string; user: Partial<UserEntity> }> {
    // Check if user exists in our database by email
    let user = await this.userRepository.findByEmail(googleUser.email);

    if (!user) {
      // Create new user if doesn't exist
      const googleUserData: GoogleUserDto = {
        email: googleUser.email,
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        google_id: googleUser.id || googleUser.sub, // Use Google's ID as identifier
        picture: googleUser.picture,
        is_email_verified: true, // Google already verified the email
      };

      user = await this.userRepository.createWithGoogle(googleUserData);
    } else {
      // Update existing user with Google information if needed
      const updateData: Partial<UserEntity> = {
        google_id: googleUser.id || googleUser.sub,
        is_email_verified: true, // Google login always verifies email
      };

      // Only update picture if user doesn't have one already
      if (user.picture === null && googleUser.picture) {
        updateData.picture = googleUser.picture;
      }

      user = await this.userRepository.update(user.id, updateData);
    }

    // Ensure user is not null before proceeding
    if (!user) {
      throw new UnauthorizedException('Failed to authenticate with Google');
    }

    // Check email verification if required (though Google users should always be verified)
    const requireEmailVerificationRaw = this.configService.get<string>(
      'REQUIRE_EMAIL_VERIFICATION',
      'false',
    );
    const requireEmailVerification = requireEmailVerificationRaw === 'true';
    if (requireEmailVerification && !user.is_email_verified) {
      throw new UnauthorizedException(
        'Email verification required. Please verify your email address before logging in.',
      );
    }

    // Create session
    const sessionId = await this.sessionService.createSession(user.id);

    // Generate JWT with session ID
    const payload = {
      email: user.email,
      sub: user.id,
      sessionId: sessionId, // Add session ID to JWT payload
    };

    const accessToken = this.jwtService.sign(payload);

    // Don't include password in the response
    const { password, ...result } = user;

    return {
      access_token: accessToken,
      user: result,
    };
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<Partial<UserEntity>> {
    // Check if user exists
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Map DTO to entity fields
    const updateData: Partial<UserEntity> = {};

    if (updateUserDto.email) {
      // Check if email is already used by another user
      const existingUser = await this.userRepository.findByEmail(
        updateUserDto.email,
      );
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already in use');
      }
      updateData.email = updateUserDto.email;
    }

    if (updateUserDto.firstName) {
      updateData.first_name = updateUserDto.firstName;
    }

    if (updateUserDto.lastName) {
      updateData.last_name = updateUserDto.lastName;
    }

    if (updateUserDto.password) {
      // Hash the password manually since @BeforeInsert is only called during creation
      const salt = await bcrypt.genSalt();
      updateData.password = await bcrypt.hash(updateUserDto.password, salt);
    }

    // Update the user
    const updatedUser = await this.userRepository.update(id, updateData);
    if (!updatedUser) {
      throw new NotFoundException('Failed to update user');
    }

    // Don't return the password in the response
    const { password, ...result } = updatedUser;
    return result;
  }

  async removeUser(id: string): Promise<void> {
    // Check if user exists
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.remove(id);
  }

  async getUserById(id: string): Promise<Partial<UserEntity>> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Don't return the password in the response
    const { password, ...result } = user;
    return result;
  }

  async getAllUsers(): Promise<Partial<UserEntity>[]> {
    const users = await this.userRepository.findAll();

    // Remove passwords from response
    return users.map((user) => {
      const { password, ...result } = user;
      return result;
    });
  }

  async updateUserRole(
    id: string,
    role: UserRole,
  ): Promise<Partial<UserEntity>> {
    // Check if user exists
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update user role
    const updatedUser = await this.userRepository.update(id, { role });
    if (!updatedUser) {
      throw new NotFoundException('Failed to update user role');
    }

    // Don't return the password in the response
    const { password, ...result } = updatedUser;
    return result;
  }

  async logout(sessionId: string): Promise<void> {
    // Destroy the session
    await this.sessionService.destroySession(sessionId);
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<void> {
    // Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify old password
    if (!user.password || !(await user.validatePassword(oldPassword))) {
      throw new UnauthorizedException('Invalid current password');
    }

    // Hash new password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    await this.userRepository.update(userId, { password: hashedPassword });

    // Note: With simplified session management, user will need to login again
    // when their current session expires naturally
  }
}
