import { UserEntity } from '../auth/entities/user.entity';

export type User = Omit<UserEntity, 'hashPassword' | 'validatePassword' | 'created_at' | 'updated_at' | 'is_email_verified'> & {
  firstName: string; // Alias for first_name
  lastName: string;  // Alias for last_name
}; 