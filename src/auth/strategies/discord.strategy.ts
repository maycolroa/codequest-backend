import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile as DiscordProfile, Strategy } from 'passport-discord';

import { AuthenticatedDiscordUser } from '../interfaces/authenticated-discord-user.interface';

@Injectable()
export class DiscordStrategy extends PassportStrategy(Strategy, 'discord') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.getOrThrow<string>('DISCORD_CLIENT_ID'),
      clientSecret: configService.getOrThrow<string>('DISCORD_CLIENT_SECRET'),
      callbackURL: configService.getOrThrow<string>('DISCORD_CALLBACK_URL'),
      scope: ['identify', 'email', 'guilds'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: DiscordProfile,
  ): AuthenticatedDiscordUser {
    const avatarUrl = profile.avatar
      ? `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`
      : null;

    return {
      discordId: profile.id,
      username: profile.username,
      email: profile.email ?? null,
      avatarUrl,
    };
  }
}
