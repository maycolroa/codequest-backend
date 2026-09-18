import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';

import { Profile } from '../entities/profile.entity';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Profile)
    private readonly profilesRepository: Repository<Profile>,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<Profile> {
    const profile = await this.profilesRepository.findOne({
      where: { id: payload.sub },
    });

    if (!profile) {
      throw new UnauthorizedException('Token no válido');
    }

    if (!profile.isActive) {
      throw new UnauthorizedException('Esta cuenta está desactivada');
    }

    return profile;
  }
}
