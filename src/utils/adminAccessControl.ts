import { HttpException, HttpStatus } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { TUser } from 'src/interface/token.type';
import { PrismaService } from 'src/prisma/prisma.service';

const adminAccessControl = async (
  prisma: PrismaService,
  user: TUser,
  publishedFor: UserRole,
) => {
  const admin = await prisma.admin.findUnique({
    where: { userId: user.id },
  });

  console.log(admin?.canAccess, publishedFor)

  if (!admin) throw new HttpException('Admin Not Found', 404);

  if (publishedFor !== admin.canAccess) {
    throw new HttpException(
      'You are not allowed to access this program',
      HttpStatus.FORBIDDEN,
    );
  }
};

export default adminAccessControl;
