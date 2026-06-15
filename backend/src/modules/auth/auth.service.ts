import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { hash, compare } from 'bcryptjs';
import { PrismaService } from '../../config/prisma.service';
import { EmailVerificationService } from './email-verification.service';
import { RegisterDto } from './dto/request/register.dto';
import { LoginDto } from './dto/request/login.dto';
import { LogoutAllDto } from './dto/request/logout-all.dto';
import { generateId } from '../../common/utils/ulid.util';
import { TABLE_PREFIX } from '../../common/types/ulid.types';
import { apiError } from '../../common/errors/api-error';
import { AUTH_ERRORS } from './auth.errors';
import { CITIES_ERRORS } from '../cities/cities.errors';
import { SHARED_ERRORS } from '../../common/errors/shared-errors';

const REGISTER_GENERIC_MESSAGE =
  'Cadastro concluído! Verifique seu e-mail para concluir o cadastro.';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly emailVerification: EmailVerificationService,
  ) {}

  // Anti-enumeração: a resposta é sempre a mesma, exista ou não o email.
  // Email duplicado vira no-op silencioso (sem erro, sem envio). Apenas
  // city_not_found ainda quebra o fluxo - é informação pública (qualquer um
  // pode listar cidades via /cities) e revelar não vaza nada de auth.
  async register(dto: RegisterDto) {
    const exists = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
    });

    if (exists) {
      // TODO: enviar email ao dono do endereço avisando que alguém tentou
      // criar conta com o email dele. Útil contra tomada de conta (pessoa
      // descobre que email vazou) e contra digitação errada de outro usuário.
      // Precisa de novo método no MailService + template + decisão de rate
      // limit (não enviar 10 avisos seguidos para o mesmo email).
      return { message: REGISTER_GENERIC_MESSAGE };
    }

    const city = await this.prisma.client.city.findFirst({
      where: { id: dto.cityId, deletedAt: null },
    });

    if (!city) {
      throw new NotFoundException(apiError(CITIES_ERRORS.CITY_NOT_FOUND));
    }

    const hashed = await hash(dto.password, 10);

    const user = await this.prisma.client.user.create({
      data: {
        id: generateId(TABLE_PREFIX.USER),
        name: dto.name,
        email: dto.email,
        password: hashed,
        cityId: dto.cityId,
      },
    });

    await this.emailVerification.sendNewCodeFor({
      id: user.id,
      email: user.email,
    });

    return { message: REGISTER_GENERIC_MESSAGE };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException(
        apiError(AUTH_ERRORS.INVALID_CREDENTIALS),
      );
    }

    const passwordMatch = await compare(dto.password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException(
        apiError(AUTH_ERRORS.INVALID_CREDENTIALS),
      );
    }

    // Trade-off de enumeração aceito: retornar `email_not_verified` revela
    // que o email existe E que a senha digitada é a correta. Ainda assim,
    // mitigamos exigindo a senha correta antes de revelar o estado (atacante
    // precisa já ter a credencial). UX > privacidade nesse ponto. Reavaliar
    // se houver requisito de segurança mais estrito no futuro.
    if (!user.emailVerifiedAt) {
      await this.emailVerification.sendNewCodeFor({
        id: user.id,
        email: user.email,
      });
      throw new UnauthorizedException(apiError(AUTH_ERRORS.EMAIL_NOT_VERIFIED));
    }

    return this.generateTokens(user.id, user.email, user.role, user.cityId);
  }

  async refresh(token: string) {
    const stored = await this.prisma.client.refreshToken.findUnique({
      where: { token },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException(
        apiError(AUTH_ERRORS.INVALID_REFRESH_TOKEN),
      );
    }

    await this.prisma.client.refreshToken.delete({ where: { token } });

    const user = await this.prisma.client.user.findUniqueOrThrow({
      where: { id: stored.userId },
    });

    return this.generateTokens(user.id, user.email, user.role, user.cityId);
  }

  async getMe(userId: string) {
    const user = await this.prisma.client.user.findUniqueOrThrow({
      where: { id: userId },
    });

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      city: user.cityId,
    };
  }

  async logout(token: string): Promise<void> {
    await this.prisma.client.refreshToken.deleteMany({
      where: { token },
    });
  }

  async logoutAll(userId: string, dto: LogoutAllDto): Promise<void> {
    const user = await this.prisma.client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException(apiError(SHARED_ERRORS.UNAUTHENTICATED));
    }

    const passwordMatch = await compare(dto.password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException(apiError(AUTH_ERRORS.INVALID_PASSWORD));
    }

    await this.prisma.client.refreshToken.deleteMany({
      where: { userId },
    });
  }
  private async generateTokens(
    userId: string,
    email: string,
    role: string,
    cityId: string | null,
  ) {
    const payload = { sub: userId, email, role, cityId };

    const accessToken = this.jwt.sign(payload);

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.client.refreshToken.create({
      data: {
        id: generateId(TABLE_PREFIX.REFRESH_TOKEN),
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return { access_token: accessToken, refresh_token: refreshToken };
  }
}
