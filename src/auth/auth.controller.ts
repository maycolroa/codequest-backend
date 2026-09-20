import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { GetUser } from './decorators/get-user.decorator';
import { Profile } from './entities/profile.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { AuthenticatedDiscordUser } from './interfaces/authenticated-discord-user.interface';
import { LoginDto } from './dto/login.dto';
import { MeResponseDto } from './dto/me-response.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('discord')
  @UseGuards(AuthGuard('discord'))
  @ApiOperation({ summary: 'Iniciar autenticación con Discord' })
  @ApiResponse({ status: 302, description: 'Redirección a Discord OAuth2' })
  discordAuth(): void {}

  @Get('discord/callback')
  @UseGuards(AuthGuard('discord'))
  @ApiOperation({ summary: 'Procesar callback de Discord y emitir JWT' })
  @ApiResponse({ status: 302, description: 'Redirección al frontend con JWT' })
  async discordCallback(
    @Req() request: Request & { user: AuthenticatedDiscordUser },
    @Res() response: Response,
  ): Promise<void> {
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const redirectUrl = new URL('/auth/callback', frontendUrl);

    try {
      const { token } = await this.authService.loginWithDiscord(request.user);
      redirectUrl.searchParams.set('token', token);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'No se pudo iniciar sesión con Discord';
      redirectUrl.searchParams.set('error', message);
    }

    response.redirect(redirectUrl.toString());
  }

  @Post('register')
  @ApiOperation({ summary: 'Crear una cuenta con correo y contraseña' })
  @ApiResponse({ status: 201, description: 'Cuenta creada y JWT emitido' })
  @ApiResponse({ status: 400, description: 'Datos inválidos o correo ya registrado' })
  register(@Body() registerDto: RegisterDto): Promise<{ profile: Profile; token: string }> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión con correo y contraseña' })
  @ApiResponse({ status: 200, description: 'JWT emitido' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas o cuenta desactivada' })
  login(@Body() loginDto: LoginDto): Promise<{ profile: Profile; token: string }> {
    return this.authService.login(loginDto);
  }

  @Post('password/change')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cambiar la contraseña de la cuenta local' })
  @ApiResponse({ status: 204, description: 'Contraseña actualizada' })
  @ApiResponse({ status: 401, description: 'JWT o contraseña actual inválidos' })
  async changePassword(
    @GetUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(userId, changePasswordDto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener el perfil autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario autenticado', type: MeResponseDto })
  @ApiResponse({ status: 401, description: 'JWT ausente, inválido o expirado' })
  async me(@GetUser('id') userId: string): Promise<MeResponseDto> {
    return MeResponseDto.fromProfile(await this.authService.getProfile(userId));
  }
}
