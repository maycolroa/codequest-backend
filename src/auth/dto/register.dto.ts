import { Transform } from 'class-transformer';
import { IsEmail, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(254)
  @Transform(({ value }: { value: string }) => value?.trim().toLowerCase())
  email: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Transform(({ value }: { value: string }) => value?.trim())
  username: string;

  @IsString()
  @MinLength(12)
  @MaxLength(128)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'La contraseña debe incluir mayúscula, minúscula y número',
  })
  password: string;
}
