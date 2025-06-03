import { Request } from 'express';
import { UserRole } from '../enums/user-role.enum';

export interface RequestWithUser extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
    sessionId: string;
    token: string;
  };
}
