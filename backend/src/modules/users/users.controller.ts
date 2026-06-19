import { Controller, Put, Body, Req } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { UsersService } from './users.service';
import { UpdateUserCityDto } from './dto/request/update-user-city.dto';
import { UpdateUserCityResponseDto } from './dto/response/update-user-city-response.dto';
import { JwtPayload } from '../auth/strategies/jwt.strategy';

type RequestWithUser = Request & {
  user: JwtPayload;
};

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put('me/city')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Atualizar cidade do usuário autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Cidade atualizada com sucesso',
    type: UpdateUserCityResponseDto,
  })
  @ApiResponse({ status: 400, description: 'validation_failed' })
  @ApiResponse({ status: 401, description: 'unauthenticated' })
  @ApiResponse({ status: 404, description: 'city_not_found' })
  @ApiResponse({ status: 429, description: 'update_too_frequent' })
  async updateCity(
    @Req() req: RequestWithUser,
    @Body() dto: UpdateUserCityDto,
  ): Promise<UpdateUserCityResponseDto> {
    const userId = req.user.sub;
    return this.usersService.updateUserCity(userId, dto.cityId);
  }
}
