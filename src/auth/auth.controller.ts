import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';

import { GetUser } from './decorators/get-user.decorator';
import { Profile } from './entities/profile.entity';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { AuthenticatedDiscordUser } from './interfaces/authenticated-discord-user.interface';

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
    const { token } = await this.authService.loginWithDiscord(request.user);
    const frontendUrl = this.configService.getOrThrow<string>('FRONTEND_URL');
    const redirectUrl = new URL(frontendUrl);
    redirectUrl.searchParams.set('token', token);
    response.redirect(redirectUrl.toString());
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener el perfil autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del usuario autenticado', type: Profile })
  @ApiResponse({ status: 401, description: 'JWT ausente, inválido o expirado' })
  me(@GetUser('id') userId: string): Promise<Profile> {
    return this.authService.getProfile(userId);
  }
}
