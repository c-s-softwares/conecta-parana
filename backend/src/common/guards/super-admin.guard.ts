import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';
import { PrismaService } from '../../config/prisma.service';
import { JwtPayload } from '../../modules/auth/strategies/jwt.strategy';

@Injectable()
export class SuperAdminGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const payload = request['user'] as JwtPayload | undefined;

    if (!payload?.sub) {
      throw new ForbiddenException('Acesso negado: Usuário não identificado');
    }

    if (payload.role !== 'ADMIN') {
      throw new ForbiddenException(
        'Acesso negado: Permissão de ADMIN requerida',
      );
    }

    const user = await this.prisma.client.user.findUnique({
      where: { id: payload.sub },
      select: { cityId: true, role: true },
    });

    if (!user || user.role !== 'ADMIN' || user.cityId !== null) {
      throw new ForbiddenException(
        'Acesso negado: Requer privilégios de Super Admin ',
      );
    }

    return true;
  }
}
