import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../config/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const exists = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
    });

    if (exists) {
      throw new ConflictException('Email já cadastrado');
    }

    const hashed = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.client.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashed,
      },
    });

    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const passwordMatch = await bcrypt.compare(dto.password, user.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    return this.generateTokens(user.id, user.email, user.role);
  }

  async refresh(token: string) {
    const stored = await this.prisma.client.refreshToken.findUnique({
      where: { token },
    });

    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token inválido ou expirado');
    }

    await this.prisma.client.refreshToken.delete({ where: { token } });

    const user = await this.prisma.client.user.findUniqueOrThrow({
      where: { id: stored.userId },
    });

    return this.generateTokens(user.id, user.email, user.role);
  }

  async getMe(userId: number) {
    const user = await this.prisma.client.user.findUniqueOrThrow({
      where: { id: userId },
    });

    return { id: user.id, name: user.name, email: user.email, role: user.role };
  }

  private async generateTokens(userId: number, email: string, role: string) {
    const payload = { sub: userId, email, role };

    const accessToken = this.jwt.sign(payload);

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.client.refreshToken.create({
      data: {
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return { access_token: accessToken, refresh_token: refreshToken };
  }
}
