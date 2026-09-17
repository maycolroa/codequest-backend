import { Injectable, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Profile } from './entities/profile.entity';
import { AuthenticatedDiscordUser } from './interfaces/authenticated-discord-user.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
    private readonly jwtService: JwtService,
  ) {}

  async loginWithDiscord(
    discordUser: AuthenticatedDiscordUser,
  ): Promise<{ profile: Profile; token: string }> {
    const profile = await this.findOrCreateUser(discordUser);
    return { profile, token: this.generateToken(profile) };
  }

  async findOrCreateUser(discordUser: AuthenticatedDiscordUser): Promise<Profile> {
    await this.profilesRepository.upsert(discordUser, ['discordId']);
    return this.profilesRepository.findOneOrFail({
      where: { discordId: discordUser.discordId },
    });
  }

  generateToken(profile: Profile): string {
    const payload: JwtPayload = {
      sub: profile.id,
      discordId: profile.discordId,
      username: profile.username,
    };

    return this.jwtService.sign(payload);
  }

  async getProfile(userId: string): Promise<Profile> {
    const profile = await this.profilesRepository.findOne({
      where: { id: userId },
    });

    if (!profile) {
      throw new NotFoundException('Perfil no encontrado');
    }

    return profile;
  }
}
