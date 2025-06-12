import { UserRole } from "@prisma/client";

export type TUser = {
  id: string;
  email: string;
  userType: UserRole;
  iat: number;
};
