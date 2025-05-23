import { User } from '../../models/user.model';
import { UserEntity } from '../entities/user.entity';

export function mapEntityToModel(entity: Partial<UserEntity>): Partial<User> | null {
  if (!entity) return null;
  
  return {
    id: entity.id,
    email: entity.email,
    firstName: entity.first_name,
    lastName: entity.last_name,
    password: entity.password, // Note: This should typically be excluded from responses
  };
}

export function mapModelToEntity(model: Partial<User>): Partial<UserEntity> | null {
  if (!model) return null;
  
  return {
    id: model.id,
    email: model.email,
    first_name: model.firstName,
    last_name: model.lastName,
    password: model.password,
  };
} 