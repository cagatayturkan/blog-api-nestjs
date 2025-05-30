import { Injectable, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { TokenBlacklistEntity } from '../entities/token-blacklist.entity';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { BlacklistReason, PASSWORD_RELATED_REASONS } from '../enums/blacklist-reason.enum';

@Injectable()
export class TokenBlacklistService {
  private temporaryWhitelist = new Set<string>(); // Temporary whitelist for tokens
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache TTL

  constructor(
    @InjectRepository(TokenBlacklistEntity)
    private readonly tokenBlacklistRepository: Repository<TokenBlacklistEntity>,
    private readonly jwtService: JwtService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async addToBlacklist(token: string, userId: string, reason: BlacklistReason = BlacklistReason.LOGOUT): Promise<void> {
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

      // Cache the blacklisted token
      await this.cacheManager.set(`blacklist:${token}`, true, this.CACHE_TTL);
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

    // Check cache first
    const cachedResult = await this.cacheManager.get<boolean>(`blacklist:${token}`);
    if (cachedResult !== undefined && cachedResult !== null) {
      return cachedResult;
    }

    const blacklistEntry = await this.tokenBlacklistRepository.findOne({
      where: { token },
    });

    const isBlacklisted = !!blacklistEntry;
    
    // Cache the result
    await this.cacheManager.set(`blacklist:${token}`, isBlacklisted, this.CACHE_TTL);

    return isBlacklisted;
  }

  async blacklistAllUserTokens(userId: string, reason: BlacklistReason = BlacklistReason.SECURITY, excludeToken?: string): Promise<void> {
    console.log(`🚫 Starting blacklistAllUserTokens for user: ${userId}, reason: ${reason}`);
    
    try {
      // Test repository connection
      console.log(`🔍 Testing repository connection...`);
      const testCount = await this.tokenBlacklistRepository.count();
      console.log(`📊 Current blacklist count: ${testCount}`);

      // Add excluded token to temporary whitelist if provided
      if (excludeToken) {
        this.temporaryWhitelist.add(excludeToken);
        // Remove from whitelist after 30 seconds
        setTimeout(() => {
          this.temporaryWhitelist.delete(excludeToken);
        }, 30000);
      }

      const userTokenKey = `USER_ALL_TOKENS_${userId}`;
      
      // First, remove any existing USER_ALL_TOKENS entry for this user
      console.log(`🗑️ Removing existing USER_ALL_TOKENS entry for user: ${userId}`);
      await this.tokenBlacklistRepository.delete({
        token: userTokenKey,
      });

      // Create a new entry to invalidate all tokens for this user
      // Explicitly set created_at to the application server's current time
      const now = new Date();
      const blacklistEntry = this.tokenBlacklistRepository.create({
        token: userTokenKey,
        user_id: userId,
        expires_at: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 24 hours from now
        reason,
        created_at: now, // Ensure created_at uses app server time
      });

      console.log(`💾 Saving blacklist entry (app time for created_at):`, blacklistEntry);
      const savedEntry = await this.tokenBlacklistRepository.save(blacklistEntry);
      console.log(`✅ Saved to database:`, savedEntry);

      // Verify save
      const verifyCount = await this.tokenBlacklistRepository.count();
      console.log(`📊 New blacklist count: ${verifyCount}`);

      // Cache the user blacklist status
      await this.cacheManager.set(`user_blacklist:${userId}`, true, this.CACHE_TTL);
      console.log(`✅ User tokens blacklisted successfully for user: ${userId}`);
    } catch (error) {
      console.error(`❌ Error blacklisting tokens for user ${userId}:`, error);
      throw error;
    }
  }

  // Modified to accept tokenIat (issued at timestamp)
  async isUserTokensBlacklisted(userId: string, currentToken?: string, tokenIat?: number): Promise<boolean> {
    console.log(`🔍 isUserTokensBlacklisted V2 called for user: ${userId}, tokenIat: ${tokenIat}`);

    // Check if current token is in temporary whitelist
    if (currentToken && this.temporaryWhitelist.has(currentToken)) {
      console.log(`⚪ Token in temporary whitelist, allowing access`);
      return false;
    }

    // Check GENERIC cache for the user's blacklist status (without IAT)
    const genericUserBlacklistCacheKey = `user_blacklist:${userId}`;
    const cachedGenericResult = await this.cacheManager.get<boolean>(genericUserBlacklistCacheKey);

    if (cachedGenericResult === false) { // Explicitly check for false
      console.log(`💾 Cache hit for GENERIC user blacklist (${genericUserBlacklistCacheKey}): false. User not generally blacklisted.`);
      return false; // If generic says not blacklisted, then definitely not.
    }
    
    // If cachedGenericResult is true or undefined, we need to check the database rule, especially if tokenIat is present.

    const userAllTokensKey = `USER_ALL_TOKENS_${userId}`;
    console.log(`[V2] Checking database for: ${userAllTokensKey}`);
    const blacklistRule = await this.tokenBlacklistRepository.findOne({
      where: { token: userAllTokensKey },
    });

    if (!blacklistRule) {
      console.log(`[V2] 🚫 No USER_ALL_TOKENS rule found for user ${userId}. User tokens are not blacklisted.`);
      // Cache this result with the generic key
      await this.cacheManager.set(genericUserBlacklistCacheKey, false, this.CACHE_TTL);
      // Also clear any potentially misleading IAT-specific cache entry
      if (tokenIat) {
        await this.cacheManager.del(`user_blacklist:${userId}_iat:${tokenIat}`);
      }
      return false;
    }

    // A USER_ALL_TOKENS rule exists.
    // Cache that a generic rule exists.
    await this.cacheManager.set(genericUserBlacklistCacheKey, true, this.CACHE_TTL);

    // Now, perform the IAT check against the rule from the database.
    // If tokenIat is not provided, or if the token was issued *before* or *at the same time* the rule was created,
    // then all tokens for this user (including the current one, if applicable) are considered blacklisted.
    if (tokenIat === undefined || (blacklistRule.created_at && tokenIat <= Math.floor(blacklistRule.created_at.getTime() / 1000))) {
      console.log(`[V2] 🎯 USER_ALL_TOKENS rule found (created at ${blacklistRule.created_at}). Token (issued at ${tokenIat}) IS considered blacklisted by this rule.`);
      // We don't need to cache the IAT-specific result here as the generic 'true' + DB check is now the flow.
      return true;
    }

    // If the token was issued *after* the blacklist rule was created, it's a new token and should be allowed.
    console.log(`[V2] 🎯 USER_ALL_TOKENS rule found (created at ${blacklistRule.created_at}), but token (issued at ${tokenIat}) is newer. Token is NOT blacklisted by this rule.`);
    // We don't need to cache an IAT-specific 'false' here; the generic 'true' + DB check handles this.
    return false;
  }

  // Clean up expired tokens from blacklist (runs daily at 2 AM)
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    const result = await this.tokenBlacklistRepository.delete({
      expires_at: LessThan(now),
    });

    console.log(`Cleaned up ${result.affected} expired blacklisted tokens`);
    
    // Note: Cache entries will expire naturally based on TTL
  }

  async clearUserBlacklist(userId: string): Promise<void> {
    // SECURITY FIX: Clear password-related blacklists to allow login after password changes
    // This includes both manual password changes and forgot password resets
    await this.tokenBlacklistRepository.delete({
      user_id: userId,
      reason: In(PASSWORD_RELATED_REASONS),
    });
    
    // Clear relevant cache entries
    await this.cacheManager.del(`user_blacklist:${userId}`);
  }

  // New method: Clear specific cache entries
  async clearCacheForUser(userId: string): Promise<void> {
    await this.cacheManager.del(`user_blacklist:${userId}`);
  }

  async clearCacheForToken(token: string): Promise<void> {
    await this.cacheManager.del(`blacklist:${token}`);
  }

  // New method: Clear only USER_ALL_TOKENS blacklist for successful login
  async clearUserAllTokensBlacklist(userId: string): Promise<void> {
    console.log(`🧹 Clearing USER_ALL_TOKENS blacklist for user: ${userId}`);
    
    const userTokenKey = `USER_ALL_TOKENS_${userId}`;
    
    // Remove USER_ALL_TOKENS entry
    const result = await this.tokenBlacklistRepository.delete({
      token: userTokenKey,
    });
    
    console.log(`✅ Removed ${result.affected} USER_ALL_TOKENS entries for user: ${userId}`);
    
    // Clear user blacklist cache
    await this.cacheManager.del(`user_blacklist:${userId}`);
    console.log(`🗑️ Cleared cache for user: ${userId}`);
  }
} 