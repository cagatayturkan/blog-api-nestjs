import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class AuthThrottlerGuard extends ThrottlerGuard {
  protected errorMessage = 'Too many requests. Please try again later.';

  protected getRequestResponse(context: any) {
    const http = context.switchToHttp();
    return {
      req: http.getRequest(),
      res: http.getResponse(),
    };
  }

  // Override to set custom limits for specific routes
  protected async getTracker(req: Record<string, any>): Promise<string> {
    return req.ip;
  }

  // Override to set custom TTL for login endpoint
  protected getOptionsForRoute(context: any): { ttl: number; limit: number } {
    const { req } = this.getRequestResponse(context);

    if (req.route?.path === '/auth/login' && req.method === 'POST') {
      return {
        ttl: 60000, // 60 seconds
        limit: 5, // 5 requests
      };
    }

    // Return default values
    return {
      ttl: 60000, // Default TTL
      limit: 10, // Default limit
    };
  }
}
