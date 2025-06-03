import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UserRepository } from './repositories/user.repository';
import { SessionService } from './services/session.service';
import { PasswordResetService } from './services/password-reset.service';
import { MailService } from './services/mail.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ThrottlerModule } from '@nestjs/throttler';
import { GoogleStrategy } from './strategies/google.strategy';
import { AdminSeeder } from './seeders/admin.seeder';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    ScheduleModule.forRoot(),
    // Add cache module for session management
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        ttl: configService.get<number>('CACHE_TTL', 5 * 60 * 1000), // 5 minutes default TTL
        max: configService.get<number>('CACHE_MAX_ITEMS', 1000), // Maximum number of items in cache
      }),
    }),
    // Specific rate limiting for auth module (stricter than global)
    ThrottlerModule.forRoot([
      {
        ttl: 60, // 60 seconds
        limit: 5, // 5 requests per minute for auth endpoints
      },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', 'your-secret-key'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', '24h'), // Longer expiry since we use sessions
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    SessionService,
    PasswordResetService,
    MailService,
    JwtStrategy,
    GoogleStrategy,
    AdminSeeder,
  ],
  exports: [PassportModule, JwtStrategy, SessionService],
})
export class AuthModule {}
