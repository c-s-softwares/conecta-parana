import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../config/prisma.service';
import { JwtPayload } from '../../modules/auth/strategies/jwt.strategy';
import { apiError, ROLE_DENIED } from '../errors/api-error';
import { SHARED_ERRORS } from '../errors/shared-errors';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const payload = request['user'] as JwtPayload | undefined;

    if (!payload?.sub) {
      throw new UnauthorizedException(apiError(SHARED_ERRORS.UNAUTHENTICATED));
    }

    if (payload.role !== 'ADMIN') {
      throw new ForbiddenException(apiError(ROLE_DENIED, ['ADMIN']));
    }

    const user = await this.prisma.client.user.findUnique({
      where: { id: payload.sub },
      select: { cityId: true, role: true },
    });

    if (!user || user.role !== 'ADMIN' || user.cityId !== null) {
      throw new ForbiddenException(
        apiError(SHARED_ERRORS.SUPER_ADMIN_REQUIRED),
      );
    }

    return true;
  }
}
