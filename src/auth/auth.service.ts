import { Injectable, UnauthorizedException, ConflictException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserRepository, GoogleUserDto } from './repositories/user.repository';
import { UserEntity } from './entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<Partial<UserEntity>> {
    // Check if user with this email already exists
    const existingUser = await this.userRepository.findByEmail(registerDto.email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create new user - password hashing is done in UserEntity @BeforeInsert
    const user = await this.userRepository.create(registerDto);

    // Don't return the password in the response
    const { password, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto): Promise<{ access_token: string, user: Partial<UserEntity> }> {
    // Find the user with the provided email
    const user = await this.userRepository.findByEmail(loginDto.email);
    
    // Check if user exists and password matches
    if (!user || !(await user.validatePassword(loginDto.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { 
      email: user.email, 
      sub: user.id,
    };
    
    // Don't include password in the response
    const { password, ...result } = user;
    
    return {
      access_token: this.jwtService.sign(payload),
      user: result
    };
  }

  async googleLogin(googleUser: any): Promise<{ access_token: string, user: Partial<UserEntity> }> {
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
        is_email_verified: true // Google already verified the email
      };
      
      user = await this.userRepository.createWithGoogle(googleUserData);
    } else {
      // Update existing user with Google information if needed
      const updateData: Partial<UserEntity> = {
        google_id: googleUser.id || googleUser.sub,
        is_email_verified: true,
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

    // Generate JWT token
    const payload = { 
      email: user.email, 
      sub: user.id,
    };
    
    // Don't include password in the response
    const { password, ...result } = user;
    
    return {
      access_token: this.jwtService.sign(payload),
      user: result
    };
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<Partial<UserEntity>> {
    // Check if user exists
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Map DTO to entity fields
    const updateData: Partial<UserEntity> = {};
    
    if (updateUserDto.email) {
      // Check if email is already used by another user
      const existingUser = await this.userRepository.findByEmail(updateUserDto.email);
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
} 