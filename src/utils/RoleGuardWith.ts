import { Reflector } from '@nestjs/core';
import { UserRole } from 'generated/prisma';
import { RolesGuard } from 'src/guard/roles.guard';

export function RoleGuardWith(role: UserRole[]) {
  return new RolesGuard(new Reflector(), role);
}
