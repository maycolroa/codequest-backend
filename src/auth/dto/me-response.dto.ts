import { ApiProperty } from '@nestjs/swagger';

import { Profile } from '../entities/profile.entity';

export class MeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ type: String, nullable: true })
  email: string | null;

  @ApiProperty({ type: String, nullable: true })
  avatarUrl: string | null;

  @ApiProperty()
  createdAt: Date;

  static fromProfile(profile: Profile): MeResponseDto {
    const dto = new MeResponseDto();
    dto.id = profile.id;
    dto.name = profile.username;
    dto.email = profile.email;
    dto.avatarUrl = profile.avatarUrl;
    dto.createdAt = profile.createdAt;
    return dto;
  }
}
