import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { TokenBlacklistEntity } from '../entities/token-blacklist.entity';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class TokenBlacklistService {
  private temporaryWhitelist = new Set<string>(); // Temporary whitelist for tokens

  constructor(
    @InjectRepository(TokenBlacklistEntity)
    private readonly tokenBlacklistRepository: Repository<TokenBlacklistEntity>,
    private readonly jwtService: JwtService,
  ) {}

  async addToBlacklist(token: string, userId: string, reason: string = 'logout'): Promise<void> {
    try {
      // Decode token to get expiration time
      const decoded = this.jwtService.decode(token) as any;
      if (!decoded || !decoded.exp) {
        throw new Error('Invalid token');
      }

      const expiresAt = new Date(decoded.exp * 1000);

      // Add to blacklist
      const blacklistEntry = this.tokenBlacklistRepository.create({
        token,
        user_id: userId,
        expires_at: expiresAt,
        reason,
      });

      await this.tokenBlacklistRepository.save(blacklistEntry);
    } catch (error) {
      // If token is already expired or invalid, we don't need to blacklist it
      console.warn('Failed to blacklist token:', error.message);
    }
  }

  async isTokenBlacklisted(token: string): Promise<boolean> {
    // Check if token is in temporary whitelist
    if (this.temporaryWhitelist.has(token)) {
      return false;
    }

    const blacklistEntry = await this.tokenBlacklistRepository.findOne({
      where: { token },
    });

    return !!blacklistEntry;
  }

  async blacklistAllUserTokens(userId: string, reason: string = 'security', excludeToken?: string): Promise<void> {
    // Add excluded token to temporary whitelist if provided
    if (excludeToken) {
      this.temporaryWhitelist.add(excludeToken);
      // Remove from whitelist after 30 seconds
      setTimeout(() => {
        this.temporaryWhitelist.delete(excludeToken);
      }, 30000);
    }

    // Create a special entry to invalidate all tokens for this user
    const blacklistEntry = this.tokenBlacklistRepository.create({
      token: `USER_ALL_TOKENS_${userId}`,
      user_id: userId,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      reason,
    });

    await this.tokenBlacklistRepository.save(blacklistEntry);
  }

  async isUserTokensBlacklisted(userId: string, currentToken?: string): Promise<boolean> {
    // Check if current token is in temporary whitelist
    if (currentToken && this.temporaryWhitelist.has(currentToken)) {
      return false;
    }

    const blacklistEntry = await this.tokenBlacklistRepository.findOne({
      where: { token: `USER_ALL_TOKENS_${userId}` },
    });

    return !!blacklistEntry;
  }

  // Clean up expired tokens from blacklist (runs daily at 2 AM)
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    const result = await this.tokenBlacklistRepository.delete({
      expires_at: LessThan(now),
    });

    console.log(`Cleaned up ${result.affected} expired blacklisted tokens`);
  }

  async clearUserBlacklist(userId: string): Promise<void> {
    // Clear all blacklisted tokens for this user
    // This is called during successful login to allow access after password changes
    await this.tokenBlacklistRepository.delete({
      user_id: userId,
    });
    
    // Also remove from temporary whitelist
    this.temporaryWhitelist.clear();
  }
} 