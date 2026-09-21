import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email: string;

  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;
}
