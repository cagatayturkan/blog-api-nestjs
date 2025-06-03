import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserRepository } from '../repositories/user.repository';
import { SessionService } from '../services/session.service';
import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private userRepository: UserRepository,
    private sessionService: SessionService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'your-secret-key'),
      passReqToCallback: true, // This allows us to access the request object
    });
  }

  async validate(req: Request, payload: any) {
    // Extract the token from the request
    const token = ExtractJwt.fromAuthHeaderAsBearerToken()(req);
    
    if (!token) {
      throw new UnauthorizedException('Token not found');
    }

    // Check if session ID exists in payload
    if (!payload.sessionId) {
      throw new UnauthorizedException('Session ID not found in token');
    }

    // Validate session and refresh its TTL
    const sessionResult = await this.sessionService.validateAndRefreshSession(payload.sessionId);
    if (!sessionResult.valid) {
      throw new UnauthorizedException('Session has expired or is invalid');
    }

    // Get full user data from database to include role
    const user = await this.userRepository.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    
    // The value returned here will be available as 'req.user'
    return { 
      id: user.id, 
      email: user.email,
      role: user.role,
      sessionId: payload.sessionId,
      token: token // Store token for potential future use
    };
  }
} 