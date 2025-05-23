import { SetMetadata } from '@nestjs/common'; // It's used to attach custom metadata to route handlers, classes, or methods.
import { UserRole } from 'generated/prisma';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
