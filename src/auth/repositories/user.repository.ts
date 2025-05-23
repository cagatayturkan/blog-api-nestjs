import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { RegisterDto } from '../dto/register.dto';

// Define a type for Google user data
export interface GoogleUserDto {
  email: string;
  firstName: string;
  lastName: string;
  google_id?: string;
  picture?: string;
  is_email_verified?: boolean;
}

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async create(registerDto: RegisterDto): Promise<UserEntity> {
    const user = this.userRepository.create({
      email: registerDto.email,
      first_name: registerDto.firstName,
      last_name: registerDto.lastName,
      password: registerDto.password,
    });

    return this.userRepository.save(user);
  }

  async createWithGoogle(googleUserData: GoogleUserDto): Promise<UserEntity> {
    const user = this.userRepository.create({
      email: googleUserData.email,
      first_name: googleUserData.firstName,
      last_name: googleUserData.lastName,
      google_id: googleUserData.google_id,
      picture: googleUserData.picture,
      is_email_verified: googleUserData.is_email_verified || true,
    });

    return this.userRepository.save(user);
  }

  async findById(id: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async update(id: string, updateData: Partial<UserEntity>): Promise<UserEntity | null> {
    await this.userRepository.update(id, updateData);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }
} 