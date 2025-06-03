import { Injectable, BadRequestException } from '@nestjs/common';
import { UserRepository } from '../repositories/user.repository';
import { MailService } from './mail.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { PasswordResetData } from '../entities/user.entity';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly mailService: MailService,
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

    // Check if user can request a reset (rate limiting)
    if (!user.canRequestReset()) {
      return {
        message:
          'A password reset email was recently sent. Please check your email or wait a few minutes before requesting again.',
      };
    }

    // Generate secure reset token
    const resetToken = this.generateResetToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    const createdAt = new Date();

    // Create reset data
    const resetData: PasswordResetData = {
      token: resetToken,
      expiresAt,
      createdAt,
    };

    // Update user with reset data
    await this.userRepository.update(user.id, { reset: resetData });

    // Send reset email
    try {
      await this.mailService.sendPasswordResetEmail(
        user.email,
        resetToken,
        user.first_name,
      );
    } catch (error) {
      // If email fails, clear the reset data
      await this.userRepository.update(user.id, { reset: null });
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
    // Find user with valid reset token
    const users = await this.userRepository.findUsersWithResetToken();
    const user = users.find((u) => u.isResetTokenValid(token));

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token.');
    }

    // Hash new password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update user password and clear reset data
    await this.userRepository.update(user.id, {
      password: hashedPassword,
      reset: null,
    });

    // Separately update refresh token to null for security
    await this.userRepository.updateRefreshToken(user.id, null);

    return {
      message:
        'Password has been reset successfully. Please login with your new password.',
    };
  }

  async validateResetToken(
    token: string,
  ): Promise<{ valid: boolean; email?: string }> {
    const users = await this.userRepository.findUsersWithResetToken();
    const user = users.find((u) => u.isResetTokenValid(token));

    if (!user) {
      return { valid: false };
    }

    return {
      valid: true,
      email: user.email,
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
    await this.userRepository.clearExpiredResetTokens();
  }
}
