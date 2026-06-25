import {
  Injectable,
  HttpException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { apiError } from '../../common/errors/api-error';
import { USERS_ERRORS } from './users.errors';
import { CITIES_ERRORS } from '../cities/cities.errors';
import { CITY_UPDATE_THROTTLE_SECONDS } from './users.constants';
import { UpdateUserCityResponseDto } from './dto/response/update-user-city-response.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async updateUserCity(
    userId: string,
    cityId: string,
  ): Promise<UpdateUserCityResponseDto> {
    const user = await this.prisma.client.user.findUniqueOrThrow({
      where: { id: userId },
    });

    if (user.cityId === cityId) {
      return {
        id: user.id,
        cityId: user.cityId,
        lastCityUpdateAt: user.lastCityUpdateAt,
      } as UpdateUserCityResponseDto;
    }

    if (user.lastCityUpdateAt) {
      const diffInMs = Date.now() - user.lastCityUpdateAt.getTime();
      const diffInSeconds = diffInMs / 1000;
      if (diffInSeconds < CITY_UPDATE_THROTTLE_SECONDS) {
        throw new HttpException(
          apiError(USERS_ERRORS.UPDATE_TOO_FREQUENT),
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    const city = await this.prisma.client.city.findFirst({
      where: { id: cityId, deletedAt: null },
    });

    if (!city) {
      throw new NotFoundException(apiError(CITIES_ERRORS.CITY_NOT_FOUND));
    }

    const updatedUser = await this.prisma.client.user.update({
      where: { id: userId },
      data: {
        city: { connect: { id: cityId } },
        lastCityUpdateAt: new Date(),
      },
      select: {
        id: true,
        cityId: true,
        lastCityUpdateAt: true,
      },
    });

    return updatedUser as UpdateUserCityResponseDto;
  }
}
