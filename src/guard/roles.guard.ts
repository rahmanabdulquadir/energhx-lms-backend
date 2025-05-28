import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { Request } from 'express';
import { ROLES_KEY } from 'src/decorator/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private role?: UserRole[],
  ) {}

  canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    const requiredRoles =
      this.reflector.get<UserRole[]>(ROLES_KEY, context.getHandler()) || [];

    // Include the role passed as a parameter (if provided)
    if (this.role) {
      this.role.map((e) => requiredRoles.push(e));
    }

    if (requiredRoles.length === 0) {
      return true;
    }

    const request: Request = context.switchToHttp().getRequest();
    const user = request['user'];
    if (!user) {
      throw new HttpException('User not found', HttpStatus.UNAUTHORIZED);
    }

    // Check if user's role matches the required roles
    const hasRole = requiredRoles.some((role) => user.userType === role);
    console.log(hasRole);
    if (!hasRole) {
      throw new HttpException(
        `Access denied. Required roles: ${requiredRoles.join(', ')}, but user has role: ${user.userType}`,
        HttpStatus.UNAUTHORIZED,
      );
    }

    return true;
  }
}
