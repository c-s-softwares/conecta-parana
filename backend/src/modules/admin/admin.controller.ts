import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { SuperAdminGuard } from '../../common/guards/super-admin.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { CreateAdminUserDto } from './dto/create-admin-user.dto';
import { CreateAdminUserResponseDto } from './dto/create-admin-user-response.dto';
import { AdminUserResponseDto } from './dto/admin-user-response.dto';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('test')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Endpoint de teste - acesso restrito a ADMIN' })
  @ApiResponse({ status: 200, description: 'Acesso permitido para ADMIN' })
  @ApiResponse({ status: 401, description: 'unauthenticated' })
  @ApiResponse({ status: 403, description: 'role_denied' })
  getAdminTest(): { message: string } {
    return { message: 'Acesso admin autorizado com sucesso' };
  }

  @Get('users')
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Listar todos os administradores (Super Admin)',
    description:
      'Retorna a lista de usuários com role ADMIN (inclui o próprio Super Admin com cityId/cityName null). Sem paginação no MVP. Ordenado por cidade (NULLS FIRST) e nome.',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de administradores retornada com sucesso',
    type: [AdminUserResponseDto],
  })
  @ApiResponse({ status: 401, description: 'unauthenticated' })
  @ApiResponse({
    status: 403,
    description: 'role_denied | super_admin_required',
  })
  listAdmins(): Promise<AdminUserResponseDto[]> {
    return this.adminService.listAdmins();
  }

  @Post('users')
  @HttpCode(201)
  @UseGuards(SuperAdminGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Cria um usuário ADMIN vinculado a uma cidade',
    description:
      'Exclusivo para Super Admin (ADMIN com cityId = null). ' +
      'Gera senha provisória e dispara email de boas-vindas. ' +
      'Falha no envio do email não desfaz a criação — verifique o flag emailSent.',
  })
  @ApiResponse({
    status: 201,
    description: 'Admin criado com sucesso',
    type: CreateAdminUserResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'validation_failed — campos ausentes ou fora do formato',
  })
  @ApiResponse({
    status: 401,
    description: 'unauthenticated — sem token ou token inválido',
  })
  @ApiResponse({
    status: 403,
    description: 'role_denied — token não pertence a um Super Admin',
  })
  @ApiResponse({
    status: 404,
    description: 'city_not_found — cityId inexistente ou cidade deletada',
  })
  @ApiResponse({
    status: 409,
    description: 'email_exists — email já em uso em users',
  })
  createAdminUser(
    @Body() dto: CreateAdminUserDto,
  ): Promise<CreateAdminUserResponseDto> {
    return this.adminService.createAdminUser(dto);
  }
}
