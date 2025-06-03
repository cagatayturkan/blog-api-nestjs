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

  async findAll(): Promise<UserEntity[]> {
    return this.userRepository.find({
      order: { created_at: 'DESC' },
    });
  }

  async update(
    id: string,
    updateData: Partial<UserEntity>,
  ): Promise<UserEntity | null> {
    await this.userRepository.update(id, updateData);
    return this.findById(id);
  }

  async remove(id: string): Promise<void> {
    await this.userRepository.delete(id);
  }

  async findByRefreshToken(refreshToken: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({
      where: { refresh_token: refreshToken },
    });
  }

  async updateRefreshToken(
    id: string,
    refreshToken: string | null | undefined,
  ): Promise<void> {
    await this.userRepository.update(id, {
      refresh_token: refreshToken === null ? null : refreshToken,
    } as any);
  }

  // Project management methods
  async addProjectToUser(
    userId: string,
    projectName: string,
  ): Promise<UserEntity | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    if (!user.projects.includes(projectName)) {
      user.projects.push(projectName);
      await this.userRepository.save(user);
    }

    return user;
  }

  async removeProjectFromUser(
    userId: string,
    projectName: string,
  ): Promise<UserEntity | null> {
    const user = await this.findById(userId);
    if (!user) return null;

    user.projects = user.projects.filter((project) => project !== projectName);
    await this.userRepository.save(user);

    return user;
  }

  async getUserProjects(userId: string): Promise<string[]> {
    const user = await this.findById(userId);
    return user?.projects || [];
  }

  async getUsersByProject(projectName: string): Promise<UserEntity[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .where(':projectName = ANY(user.projects)', { projectName })
      .getMany();
  }

  async checkUserHasAccessToProject(
    userId: string,
    projectName: string,
  ): Promise<boolean> {
    const user = await this.findById(userId);
    if (!user) return false;

    // SUPER_ADMIN has access to all projects
    if (user.role === 'SUPER_ADMIN') {
      return true;
    }

    // Check if user has this project
    return user.projects.includes(projectName);
  }

  // Password reset methods
  async findUsersWithResetToken(): Promise<UserEntity[]> {
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.reset IS NOT NULL')
      .getMany();
  }

  async clearExpiredResetTokens(): Promise<void> {
    const now = new Date();
    await this.userRepository
      .createQueryBuilder()
      .update(UserEntity)
      .set({ reset: null })
      .where("reset->>'expiresAt' < :now", { now: now.toISOString() })
      .execute();
  }
}
