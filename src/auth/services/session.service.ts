import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SessionService {
  private readonly SESSION_PREFIX = 'session_';
  private readonly sessionTtlMs: number;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private configService: ConfigService,
  ) {
    // Get TTL from environment variable, default to 60 seconds
    const sessionTtlSeconds = this.configService.get<number>('SESSION_TTL_SECONDS', 60);
    this.sessionTtlMs = sessionTtlSeconds * 1000; // Convert to milliseconds
  }

  /**
   * Create a new session and return session ID
   */
  async createSession(userId: string): Promise<string> {
    const sessionId = uuidv4();
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    
    const sessionData = {
      userId,
      createdAt: new Date(),
      lastActivity: new Date(),
    };

    // Store session data
    await this.cacheManager.set(sessionKey, sessionData, this.sessionTtlMs);
    
    return sessionId;
  }

  /**
   * Check if session exists and update last activity
   */
  async validateAndRefreshSession(sessionId: string): Promise<{ valid: boolean; userId?: string }> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    
    const sessionData = await this.cacheManager.get<any>(sessionKey);
    
    if (!sessionData) {
      return { valid: false };
    }

    // Update last activity and refresh TTL
    const updatedSessionData = {
      ...sessionData,
      lastActivity: new Date(),
    };

    await this.cacheManager.set(sessionKey, updatedSessionData, this.sessionTtlMs);
    
    return { 
      valid: true, 
      userId: sessionData.userId 
    };
  }

  /**
   * Destroy a session
   */
  async destroySession(sessionId: string): Promise<void> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    await this.cacheManager.del(sessionKey);
  }

  /**
   * Get session info
   */
  async getSessionInfo(sessionId: string): Promise<any> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    return await this.cacheManager.get(sessionKey);
  }

  /**
   * Get current session TTL in milliseconds (for debugging/info)
   */
  getSessionTtlMs(): number {
    return this.sessionTtlMs;
  }
} 