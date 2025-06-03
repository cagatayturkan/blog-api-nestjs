import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from './posts/entities/post.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UserEntity } from './auth/entities/user.entity';
import { ProjectEntity } from './projects/entities/project.entity';
import { CategoryEntity } from './categories/entities/category.entity';
import { UserProjectsModule } from './user-projects/user-projects.module';
import { ProjectsModule } from './projects/projects.module';
import { CategoriesModule } from './categories/categories.module';
import { ProjectFilterMiddleware } from './common/middleware/project-filter.middleware';
import { PostsController } from './posts/posts.controller';
import { CategoriesController } from './categories/categories.controller';
import { SentryModule } from '@sentry/nestjs/setup';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';

@Module({
  imports: [
    SentryModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PostsModule,
    AuthModule,
    UserProjectsModule,
    ProjectsModule,
    CategoriesModule,
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.get<number>('THROTTLE_TTL', 60000),
          limit: configService.get<number>('THROTTLE_LIMIT', 10),
        },
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'cagatayturkann'),
        password: configService.get('DB_PASSWORD', 'mypassword'),
        database: configService.get('DB_DATABASE', 'nestjstest'),
        entities: [
          PostEntity,
          UserEntity,
          ProjectEntity,
          CategoryEntity,
        ],
        synchronize: configService.get('NODE_ENV') === 'development',
      }),
    }),
    TypeOrmModule.forFeature([ProjectEntity]),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
    ProjectFilterMiddleware,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ProjectFilterMiddleware)
      .forRoutes(PostsController, CategoriesController);
  }
}
