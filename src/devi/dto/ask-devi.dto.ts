import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AskDeviDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  message!: string;
}
