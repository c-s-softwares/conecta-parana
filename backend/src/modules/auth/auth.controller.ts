import { Controller, Post, Get, Body, Request, HttpCode } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import type { Request as ExpressRequest } from 'express';
import { AuthService } from './auth.service';
import { PasswordResetService } from './password-reset.service';
import { EmailVerificationService } from './email-verification.service';
import { RegisterDto } from './dto/request/register.dto';
import { LoginDto } from './dto/request/login.dto';
import { RefreshDto } from './dto/request/refresh.dto';
import { LogoutDto } from './dto/request/logout.dto';
import { LogoutAllDto } from './dto/request/logout-all.dto';
import { ForgotPasswordDto } from './dto/request/forgot-password.dto';
import { ResetPasswordDto } from './dto/request/reset-password.dto';
import { VerifyResetCodeDto } from './dto/request/verify-reset-code.dto';
import { VerifyEmailDto } from './dto/request/verify-email.dto';
import { ResendVerificationDto } from './dto/request/resend-verification.dto';
import { Public } from '../../common/decorators/public.decorator';
import { JwtPayload } from './strategies/jwt.strategy';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly passwordResetService: PasswordResetService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Post('register')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Cadastrar novo usuário' })
  @ApiResponse({
    status: 200,
    description: 'Resposta genérica (não revela se o email existe)',
  })
  @ApiResponse({
    status: 400,
    description: 'Erro de validação (validation_failed)',
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
  @ApiResponse({
    status: 401,
    description:
      'Credenciais inválidas (invalid_credentials) OU email não verificado (email_not_verified)',
  })
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

  @Post('forgot-password')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Solicitar código de redefinição de senha' })
  @ApiResponse({
    status: 200,
    description: 'Resposta genérica (não revela se o email existe)',
  })
  @ApiResponse({
    status: 400,
    description:
      'Dados inválidos (validation_failed) OU email ainda não verificado (email_not_verified) - nesse caso, um código de verificação foi enviado',
  })
  @ApiResponse({
    status: 429,
    description: 'Muitas tentativas (too_many_attempts)',
  })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.passwordResetService.forgotPassword(dto);
  }

  @Post('verify-email')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Confirmar email com código de verificação' })
  @ApiResponse({ status: 200, description: 'Email verificado com sucesso' })
  @ApiResponse({
    status: 400,
    description:
      'Código inválido/expirado (invalid_or_expired_code) OU dados inválidos (validation_failed)',
  })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.emailVerificationService.verify(dto);
  }

  @Post('resend-verification')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Reenviar código de verificação de email' })
  @ApiResponse({
    status: 200,
    description: 'Resposta genérica (não revela se o email existe)',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos (validation_failed)',
  })
  @ApiResponse({
    status: 429,
    description: 'Muitas tentativas (too_many_attempts)',
  })
  async resendVerification(@Body() dto: ResendVerificationDto) {
    return this.emailVerificationService.resend(dto);
  }

  @Post('verify-reset-code')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Validar código de redefinição sem consumi-lo' })
  @ApiResponse({ status: 200, description: 'Código válido' })
  @ApiResponse({
    status: 400,
    description:
      'Código inválido/expirado (invalid_or_expired_code) OU dados inválidos (validation_failed)',
  })
  async verifyResetCode(@Body() dto: VerifyResetCodeDto) {
    return this.passwordResetService.verifyResetCode(dto);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'Redefinir senha com código de verificação' })
  @ApiResponse({ status: 200, description: 'Senha alterada com sucesso' })
  @ApiResponse({
    status: 400,
    description:
      'Código inválido/expirado (invalid_or_expired_code) OU senha fraca (weak_password) OU dados inválidos (validation_failed)',
  })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(dto);
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
