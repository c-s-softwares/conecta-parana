import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { hash } from 'bcryptjs';
import { PrismaService } from '../../config/prisma.service';
import { MailService } from '../mail/mail.service';
import { apiError } from '../../common/errors/api-error';
import { ADMIN_ERRORS } from './admin.errors';
import { CITIES_ERRORS } from '../cities/cities.errors';
import { generateId } from '../../common/utils/ulid.util';
import { TABLE_PREFIX } from '../../common/types/ulid.types';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { CreateAdminUserResponseDto } from './dto/create-admin-user-response.dto';
import { Role } from '@prisma/client';

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async createAdminUser(
    dto: CreateAdminUserDto,
  ): Promise<CreateAdminUserResponseDto> {
    // 1. Verificar unicidade do email
    const existing = await this.prisma.client.user.findUnique({
      where: { email: dto.email },
      select: { id: true },
    });

    if (existing) {
      throw new ConflictException(apiError(ADMIN_ERRORS.EMAIL_EXISTS));
    }

    // 2. Verificar que a cidade existe e não está deletada
    const city = await this.prisma.client.city.findFirst({
      where: { id: dto.cityId, deletedAt: null },
      select: { id: true, name: true },
    });

    if (!city) {
      throw new NotFoundException(apiError(CITIES_ERRORS.CITY_NOT_FOUND));
    }

    // 3. Gerar senha provisória (16 chars URL-safe via base64url)
    const provisionalPassword = randomBytes(12).toString('base64url');
    const hashedPassword = await hash(provisionalPassword, 10);

    // 4. Persistir o novo usuário ADMIN
    const user = await this.prisma.client.user.create({
      data: {
        id: generateId(TABLE_PREFIX.USER),
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        role: Role.ADMIN,
        cityId: dto.cityId,
      },
    });

    // 5. Tentar envio do email de boas-vindas
    //    Falha de email é efeito colateral externo — não desfaz a criação.
    let emailSent = false;
    try {
      await this.mail.sendAdminWelcome({
        email: user.email,
        name: user.name,
        password: provisionalPassword,
        cityName: city.name,
      });
      emailSent = true;
    } catch (err: unknown) {
      this.logger.error(
        { err, userId: user.id },
        'Falha ao enviar email de boas-vindas para o admin criado. emailSent=false.',
      );
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      cityId: user.cityId as string,
      role: user.role,
      emailSent,
    };
  }
}
