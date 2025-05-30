import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, MoreThan } from 'typeorm';
import { PasswordResetEntity } from '../entities/password-reset.entity';
import { UserRepository } from '../repositories/user.repository';
import { MailService } from './mail.service';
import { TokenBlacklistService } from './token-blacklist.service';
import { BlacklistReason } from '../enums/blacklist-reason.enum';
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordResetService {
  constructor(
    @InjectRepository(PasswordResetEntity)
    private readonly passwordResetRepository: Repository<PasswordResetEntity>,
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  async requestPasswordReset(email: string): Promise<{ message: string }> {
    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return {
        message: 'If the email exists, a password reset link has been sent.',
      };
    }

    // Check if there's already a recent reset request (within last 5 minutes)
    const recentReset = await this.passwordResetRepository.findOne({
      where: {
        user_id: user.id,
        is_used: false,
        created_at: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      },
    });

    if (recentReset) {
      return {
        message:
          'A password reset email was recently sent. Please check your email or wait a few minutes before requesting again.',
      };
    }

    // Generate secure reset token
    const resetToken = this.generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    // Invalidate any existing unused tokens for this user
    await this.passwordResetRepository.update(
      { user_id: user.id, is_used: false },
      { is_used: true },
    );

    // Create new reset token
    const passwordReset = this.passwordResetRepository.create({
      user_id: user.id,
      token: resetToken,
      expires_at: expiresAt,
      is_used: false,
    });

    await this.passwordResetRepository.save(passwordReset);

    // Send reset email
    try {
      await this.mailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.first_name,
      );
    } catch (error) {
      // If email fails, remove the reset token
      await this.passwordResetRepository.delete(passwordReset.id);
      throw new BadRequestException(
        'Failed to send password reset email. Please try again later.',
      );
    }

    return {
      message: 'If the email exists, a password reset link has been sent.',
    };
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    // Find valid reset token
    const passwordReset = await this.passwordResetRepository.findOne({
      where: {
        token,
        is_used: false,
        expires_at: MoreThan(new Date()), // Find tokens that haven't expired yet
      },
      relations: ['user'],
    });

    if (!passwordReset) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    // Hash new password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password
    await this.userRepository.update(passwordReset.user_id, {
      password: hashedPassword,
    });

    // Mark token as used
    await this.passwordResetRepository.update(passwordReset.id, {
      is_used: true,
    });

    // Invalidate all refresh tokens for security
    await this.userRepository.updateRefreshToken(passwordReset.user_id, null);

    // CRITICAL FIX: Blacklist all existing access tokens for this user
    try {
      await this.tokenBlacklistService.blacklistAllUserTokens(
        passwordReset.user_id,
        BlacklistReason.PASSWORD_RESET,
      );
    } catch (error) {
      console.error(
        `❌ Failed to blacklist tokens for user ${passwordReset.user_id}:`,
        error,
      );
      // Don't throw error here - password reset should still succeed
    }

    return {
      message:
        'Password has been reset successfully. Please login with your new password.',
    };
  }

  async validateResetToken(
    token: string,
  ): Promise<{ valid: boolean; email?: string }> {
    const passwordReset = await this.passwordResetRepository.findOne({
      where: {
        token,
        is_used: false,
        expires_at: MoreThan(new Date()), // Find tokens that haven't expired yet
      },
      relations: ['user'],
    });

    if (!passwordReset) {
      return { valid: false };
    }

    return {
      valid: true,
      email: passwordReset.user.email,
    };
  }

  private generateResetToken(): string {
    // Generate a secure random token
    return (
      uuidv4() +
      '-' +
      Date.now().toString(36) +
      '-' +
      Math.random().toString(36).substr(2, 9)
    );
  }

  // Clean up expired reset tokens (runs daily at 3 AM)
  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    const result = await this.passwordResetRepository.delete({
      expires_at: LessThan(now),
    });
  }

  // Clean up old used tokens (runs weekly)
  @Cron(CronExpression.EVERY_WEEK)
  async cleanupUsedTokens(): Promise<void> {
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const result = await this.passwordResetRepository.delete({
      is_used: true,
      created_at: LessThan(oneWeekAgo),
    });
  }
}
