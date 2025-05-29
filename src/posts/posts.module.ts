import { Module } from '@nestjs/common';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PostEntity } from './entities/post.entity';
import { CategoryEntity } from '../categories/entities/category.entity';
import { ProjectEntity } from '../projects/entities/project.entity';
import { UserProjectsModule } from '../user-projects/user-projects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PostEntity, CategoryEntity, ProjectEntity]),
    UserProjectsModule,
  ],
  controllers: [PostsController],
  providers: [PostsService]
})
export class PostsModule {}
