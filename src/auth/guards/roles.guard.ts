import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums/user-role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();
    
    const hasRole = requiredRoles.some((role) => user.role?.includes?.(role) || user.role === role);
    
    if (!hasRole) {
      const userRole = user.role || 'No role';
      const requiredRolesStr = requiredRoles.join(', ');
      throw new ForbiddenException(
        `Access denied. Required roles: [${requiredRolesStr}]. Your role: ${userRole}`
      );
    }
    
    return true;
  }
} 