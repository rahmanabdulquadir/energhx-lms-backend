import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config/dist/config.service';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new HttpException('Token Not Provided', 401);
    }
    try {
      const decoded = await this.jwtService.verifyAsync(token, {
        secret: new ConfigService().getOrThrow('JWT_SECRET'),
      });
      const { email } = decoded;

      const user = await this.prisma.user.findUnique({
        where: { email: email },
      });

      console.log(user)

      if (!user) {
        throw new HttpException('User not found!', 404);
      }
      if (user?.status === 'BLOCKED') {
        throw new HttpException('User is blocked!', 403);
      }
      if (!user?.isVerified) {
        throw new HttpException('Unverified User!', 403);
      }
      request['user'] = decoded;
    } catch (error) {
      throw new HttpException('Could not Verify Token!', 401);
    }

    return true;
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const token = request.headers.authorization;
    return token;
  }
}
