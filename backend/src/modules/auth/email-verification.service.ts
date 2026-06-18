import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { randomInt, createHash } from 'crypto';
import * as Sentry from '@sentry/node';
import { PrismaService } from '../../config/prisma.service';
import { MailService } from '../mail/mail.service';
import { VerifyEmailDto } from './dto/request/verify-email.dto';
import { ResendVerificationDto } from './dto/request/resend-verification.dto';
import { generateId } from '../../common/utils/ulid.util';
import { TABLE_PREFIX } from '../../common/types/ulid.types';
import { apiError } from '../../common/errors/api-error';
import { AUTH_ERRORS } from './auth.errors';
import { SHARED_ERRORS } from '../../common/errors/shared-errors';
import { CACHE_TTL_1_HOUR } from '../../common/constants/cache.constants';
import {
  VERIFICATION_CODE_EXPIRATION_MS,
  VERIFICATION_CODE_LENGTH,
} from '../../common/constants/verification-code.constants';

const RESEND_MAX_ATTEMPTS = 3;
const CODE_UPPER_BOUND = 10 ** VERIFICATION_CODE_LENGTH;
const GENERIC_RESEND_MESSAGE =
  'Se um cadastro pendente existir, enviamos um novo código de verificação.';
const VERIFY_SUCCESS_MESSAGE = 'Email verificado';

interface UserRef {
  id: string;
  email: string;
}

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  // Ponto único de geração/envio de código de verificação. Chamado pelo
  // register, pelo login (se não verificado), pelo forgot-password (se não
  // verificado) e pelo resend explícito. Falha de envio loga no Sentry mas
  // não propaga - cliente recebe a resposta normal e pode usar resend depois.
  async sendNewCodeFor(user: UserRef): Promise<void> {
    const code = this.generateNumericCode();
    const codeHash = this.sha256(code);
    const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRATION_MS);

    await this.prisma.client.emailVerificationCode.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await this.prisma.client.emailVerificationCode.create({
      data: {
        id: generateId(TABLE_PREFIX.EMAIL_VERIFICATION_CODE),
        userId: user.id,
        codeHash,
        expiresAt,
      },
    });

    try {
      await this.mail.sendVerificationCode({
        email: user.email,
        code,
        expiresAt,
      });
    } catch (err) {
      this.logger.error(
        `Falha ao enviar código de verificação para ${user.email}`,
        err,
      );
      Sentry.captureException(err);
    }
  }

  async verify(dto: VerifyEmailDto): Promise<{ message: string }> {
    const user = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException(
        apiError(AUTH_ERRORS.INVALID_OR_EXPIRED_CODE),
      );
    }

    const codeHash = this.sha256(dto.code);
    const record = await this.prisma.client.emailVerificationCode.findUnique({
      where: { codeHash },
    });

    if (
      !record ||
      record.userId !== user.id ||
      record.usedAt !== null ||
      record.expiresAt <= new Date()
    ) {
      throw new BadRequestException(
        apiError(AUTH_ERRORS.INVALID_OR_EXPIRED_CODE),
      );
    }

    await this.prisma.client.$transaction([
      this.prisma.client.emailVerificationCode.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.client.user.update({
        where: { id: user.id },
        data: { emailVerifiedAt: new Date() },
      }),
    ]);

    return { message: VERIFY_SUCCESS_MESSAGE };
  }

  async resend(dto: ResendVerificationDto): Promise<{ message: string }> {
    await this.consumeRateLimit(dto.email);

    const user = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
    });

    // Mensagem genérica para qualquer cenário - email não existe, já verificado
    // ou pendente. Evita enumeração por diferença de comportamento.
    if (user && !user.emailVerifiedAt) {
      await this.sendNewCodeFor({ id: user.id, email: user.email });
    }

    return { message: GENERIC_RESEND_MESSAGE };
  }

  // Mesma decisão documentada no password-reset.service.ts: race aceita.
  private async consumeRateLimit(email: string): Promise<void> {
    const key = `resend-verification:${email}`;
    const current = (await this.cache.get<number>(key)) ?? 0;

    if (current >= RESEND_MAX_ATTEMPTS) {
      throw new HttpException(apiError(SHARED_ERRORS.TOO_MANY_ATTEMPTS), 429);
    }

    await this.cache.set(key, current + 1, CACHE_TTL_1_HOUR);
  }

  private generateNumericCode(): string {
    return randomInt(0, CODE_UPPER_BOUND)
      .toString()
      .padStart(VERIFICATION_CODE_LENGTH, '0');
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
