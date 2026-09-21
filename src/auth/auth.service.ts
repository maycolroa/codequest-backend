import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Profile } from './entities/profile.entity';
import { AuthenticatedDiscordUser } from './interfaces/authenticated-discord-user.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { RegisterDto } from './dto/register.dto';

const scrypt = promisify(scryptCallback);
const SCRYPT_KEY_LENGTH = 64;

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
    const existingProfile = await this.profilesRepository.findOne({
      where: { discordId: discordUser.discordId },
    });

    if (existingProfile) {
      await this.profilesRepository.update(existingProfile.id, discordUser);
      return this.getProfile(existingProfile.id);
    }

    try {
      await this.profilesRepository.insert(discordUser);
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new BadRequestException(
          'Ya existe una cuenta con este correo. Inicia sesión con contraseña para vincular Discord.',
        );
      }
      throw error;
    }

    return this.profilesRepository.findOneOrFail({
      where: { discordId: discordUser.discordId },
    });
  }

  async register(registerDto: RegisterDto): Promise<{ profile: Profile; token: string }> {
    const email = registerDto.email.trim().toLowerCase();
    const username = registerDto.username.trim();
    const existingProfile = await this.profilesRepository.findOne({ where: { email } });

    if (existingProfile) {
      throw new BadRequestException('No se pudo crear la cuenta con esos datos');
    }

    try {
      const savedProfile = await this.profilesRepository.save(
        this.profilesRepository.create({
          email,
          username,
          passwordHash: await this.hashPassword(registerDto.password),
          discordId: null,
        }),
      );
      const profile = await this.getProfile(savedProfile.id);
      return { profile, token: this.generateToken(profile) };
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) {
        throw new BadRequestException('No se pudo crear la cuenta con esos datos');
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto): Promise<{ profile: Profile; token: string }> {
    const email = loginDto.email.trim().toLowerCase();
    const profile = await this.profilesRepository
      .createQueryBuilder('profile')
      .addSelect('profile.passwordHash')
      .where('profile.email = :email', { email })
      .getOne();

    if (!profile || !profile.passwordHash || !(await this.verifyPassword(loginDto.password, profile.passwordHash))) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }

    if (!profile.isActive) {
      throw new UnauthorizedException('Esta cuenta está desactivada');
    }

    profile.passwordHash = null;
    return { profile, token: this.generateToken(profile) };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    const profile = await this.profilesRepository
      .createQueryBuilder('profile')
      .addSelect('profile.passwordHash')
      .where('profile.id = :userId', { userId })
      .getOne();

    if (!profile || !profile.passwordHash) {
      throw new BadRequestException(
        'Esta cuenta no tiene una contraseña configurada. Usa el acceso de Discord.',
      );
    }

    if (!(await this.verifyPassword(changePasswordDto.currentPassword, profile.passwordHash))) {
      throw new UnauthorizedException('La contraseña actual es incorrecta');
    }

    await this.profilesRepository.update(userId, {
      passwordHash: await this.hashPassword(changePasswordDto.newPassword),
    });
  }

  generateToken(profile: Profile): string {
    const payload: JwtPayload = {
      sub: profile.id,
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

  private async hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('base64url');
    const derivedKey = (await scrypt(password, salt, SCRYPT_KEY_LENGTH)) as Buffer;
    return `scrypt$${salt}$${derivedKey.toString('base64url')}`;
  }

  private async verifyPassword(password: string, encodedHash: string): Promise<boolean> {
    const [algorithm, salt, storedKey] = encodedHash.split('$');
    if (algorithm !== 'scrypt' || !salt || !storedKey) return false;

    const derivedKey = (await scrypt(password, salt, SCRYPT_KEY_LENGTH)) as Buffer;
    const storedKeyBuffer = Buffer.from(storedKey, 'base64url');
    return (
      storedKeyBuffer.length === derivedKey.length &&
      timingSafeEqual(storedKeyBuffer, derivedKey)
    );
  }

  private isUniqueViolation(error: unknown): error is { code: string } {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
  }
}
