import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { apiError } from '../errors/api-error';
import { SHARED_ERRORS } from '../errors/shared-errors';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException(apiError(SHARED_ERRORS.UNAUTHENTICATED));
    }

    try {
      const payload = await this.jwtService.verifyAsync<
        Record<string, unknown>
      >(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });
      (request as Request & { user: Record<string, unknown> }).user = payload;
    } catch {
      throw new UnauthorizedException(apiError(SHARED_ERRORS.UNAUTHENTICATED));
    }

    return true;
  }

  private extractToken(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
