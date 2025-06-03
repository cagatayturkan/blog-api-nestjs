import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProjectsController } from './user-projects.controller';
import { UserProjectsService } from './user-projects.service';
import { UserEntity } from '../auth/entities/user.entity';
import { ProjectEntity } from '../projects/entities/project.entity';
import { UserRepository } from '../auth/repositories/user.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([UserEntity, ProjectEntity]),
  ],
  controllers: [UserProjectsController],
  providers: [UserProjectsService, UserRepository],
  exports: [UserProjectsService],
})
export class UserProjectsModule {} 