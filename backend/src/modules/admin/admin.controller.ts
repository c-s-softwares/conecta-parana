import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('admin')
@Controller('admin')
export class AdminController {
  @Get('test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Endpoint de teste — acesso restrito a ADMIN' })
  @ApiResponse({ status: 200, description: 'Acesso permitido para ADMIN' })
  @ApiResponse({ status: 401, description: 'Token ausente ou inválido' })
  @ApiResponse({ status: 403, description: 'Acesso negado — role insuficiente' })
  getAdminTest(): { message: string } {
    return { message: 'Acesso admin autorizado com sucesso' };
  }
}
