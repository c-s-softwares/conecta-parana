import {
  BadRequestException,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { hash } from 'bcryptjs';
import { randomInt, createHash } from 'crypto';
import { PrismaService } from '../../config/prisma.service';
import { MailService } from '../mail/mail.service';
import { EmailVerificationService } from './email-verification.service';
import { ForgotPasswordDto } from './dto/request/forgot-password.dto';
import { ResetPasswordDto } from './dto/request/reset-password.dto';
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
import { isStrongPassword } from '../../common/utils/password.util';

const FORGOT_PASSWORD_MAX_ATTEMPTS = 3;
const CODE_UPPER_BOUND = 10 ** VERIFICATION_CODE_LENGTH;
const GENERIC_FORGOT_MESSAGE = 'Se o email existir, código enviado';
const RESET_SUCCESS_MESSAGE = 'Senha alterada';

@Injectable()
export class PasswordResetService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly emailVerification: EmailVerificationService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    await this.consumeRateLimit(dto.email);

    const user = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      return { message: GENERIC_FORGOT_MESSAGE };
    }

    // Trade-off de enumeração aceito: a resposta `email_not_verified` aqui
    // diferencia "email existe mas não verificado" de "email não existe" (que
    // retorna 200 genérico). UX > privacidade nesse ponto - sem isso, usuário
    // legítimo não verificado não saberia o que fazer. Reavaliar no futuro.
    if (!user.emailVerifiedAt) {
      await this.emailVerification.sendNewCodeFor({
        id: user.id,
        email: user.email,
      });
      throw new BadRequestException(apiError(AUTH_ERRORS.EMAIL_NOT_VERIFIED));
    }

    const code = this.generateNumericCode();
    const codeHash = this.sha256(code);
    const expiresAt = new Date(Date.now() + VERIFICATION_CODE_EXPIRATION_MS);

    await this.prisma.client.passwordResetCode.updateMany({
      where: { userId: user.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    await this.prisma.client.passwordResetCode.create({
      data: {
        id: generateId(TABLE_PREFIX.PASSWORD_RESET_CODE),
        userId: user.id,
        codeHash,
        expiresAt,
      },
    });

    await this.mail.sendPasswordResetCode({
      email: user.email,
      code,
      expiresAt,
    });

    return { message: GENERIC_FORGOT_MESSAGE };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    this.assertStrongPassword(dto.newPassword);

    const user = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException(
        apiError(AUTH_ERRORS.INVALID_OR_EXPIRED_CODE),
      );
    }

    const codeHash = this.sha256(dto.code);
    const record = await this.prisma.client.passwordResetCode.findUnique({
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

    const newPasswordHash = await hash(dto.newPassword, 10);

    await this.prisma.client.$transaction([
      this.prisma.client.passwordResetCode.update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      }),
      this.prisma.client.user.update({
        where: { id: user.id },
        data: { password: newPasswordHash },
      }),
      this.prisma.client.refreshToken.deleteMany({
        where: { userId: user.id },
      }),
    ]);

    return { message: RESET_SUCCESS_MESSAGE };
  }

  // Race condition aceita: duas requisições concorrentes podem ler o mesmo `current` e
  // gravar `current + 1`, permitindo no máximo 1 tentativa extra além do limite.
  private async consumeRateLimit(email: string): Promise<void> {
    const key = `forgot-password:${email}`;
    const current = (await this.cache.get<number>(key)) ?? 0;

    if (current >= FORGOT_PASSWORD_MAX_ATTEMPTS) {
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

  private assertStrongPassword(password: string): void {
    if (!isStrongPassword(password)) {
      throw new BadRequestException(apiError(AUTH_ERRORS.WEAK_PASSWORD));
    }
  }
}
