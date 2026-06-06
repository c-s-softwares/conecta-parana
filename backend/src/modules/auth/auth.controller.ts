import { Controller, Post, Get, Body, Request, HttpCode } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/request/register.dto';
import { LoginDto } from './dto/request/login.dto';
import { RefreshDto } from './dto/request/refresh.dto';
import { LogoutDto } from './dto/request/logout.dto';
import { LogoutAllDto } from './dto/request/logout-all.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtPayload } from './strategies/jwt.strategy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Cadastrar novo usuário' })
  @ApiResponse({ status: 201, description: 'Usuário criado com sucesso!' })
  @ApiResponse({
    status: 400,
    description:
      'Erro de validação (validation_failed) OU falha genérica de registro (registration_failed)',
  })
  @ApiResponse({
    status: 404,
    description: 'Cidade não encontrada (city_not_found)',
  })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Autenticar usuário' })
  @ApiResponse({ status: 200, description: 'Autenticação bem-sucedida' })
  @ApiResponse({ status: 401, description: 'Credenciais inválidas' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Gerar novo token de acesso usando refresh token' })
  @ApiResponse({
    status: 200,
    description: 'Token de acesso renovado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Refresh token inválido ou expirado',
  })
  async refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Retorno de dados do usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Informações do usuário retornadas com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de autenticação inválido ou expirado',
  })
  me(@Request() req: ExpressRequest) {
    const user = req['user'] as JwtPayload;
    return this.authService.getMe(user.sub);
  }
  @Post('logout')
  @HttpCode(204)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoga um refresh token' })
  @ApiResponse({
    status: 204,
    description: 'Refresh token revogado com sucesso',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso inválido ou expirado',
  })
  async logout(@Body() dto: LogoutDto) {
    await this.authService.logout(dto.refresh_token);
  }

  @Post('logout-all')
  @HttpCode(204)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoga todos os refresh tokens do usuário' })
  @ApiResponse({
    status: 204,
    description: 'Todos os refresh tokens revogados com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Body ausente ou formato inválido',
  })
  @ApiResponse({
    status: 401,
    description: 'Token de acesso ausente/expirado ou senha incorreta',
  })
  async logoutAll(@Request() req: ExpressRequest, @Body() dto: LogoutAllDto) {
    const user = req['user'] as JwtPayload;
    await this.authService.logoutAll(user.sub, dto);
  }
}
