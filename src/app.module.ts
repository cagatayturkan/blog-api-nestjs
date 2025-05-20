import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PostsModule } from './posts/posts.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from './posts/entities/post.entity';

@Module({
  imports: [
    PostsModule,
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // Time to live in milliseconds (e.g., 60 seconds)
        limit: 10, // Max requests per TTL per IP
      },
    ]),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost', // Assuming DB is running on localhost from Docker
      port: 5432,
      username: 'cagatayturkann',
      password: 'mypassword',
      database: 'nestjstest',
      entities: [PostEntity],
      synchronize: true, // Geliştirme için true, production'da false olmalı
    }),
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
