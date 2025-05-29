import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProjectsController } from './user-projects.controller';
import { UserProjectsService } from './user-projects.service';
import { UserProjectEntity } from './entities/user-project.entity';
import { UserEntity } from '../auth/entities/user.entity';
import { ProjectEntity } from '../projects/entities/project.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserProjectEntity, UserEntity, ProjectEntity]),
  ],
  controllers: [UserProjectsController],
  providers: [UserProjectsService],
  exports: [UserProjectsService],
})
export class UserProjectsModule {} 