import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { CategoryEntity } from './entities/category.entity';
import { ProjectEntity } from '../projects/entities/project.entity';
import { PostEntity } from '../posts/entities/post.entity';
import { UserProjectsModule } from '../user-projects/user-projects.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CategoryEntity, ProjectEntity, PostEntity]),
    UserProjectsModule,
  ],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {} 