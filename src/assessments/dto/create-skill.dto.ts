import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class CreateSkillDto {
  @ApiProperty({ example: 'JavaScript' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'javascript', description: 'Identificador estable usado por cursos y rutas.' })
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug: string;

  @ApiPropertyOptional({ example: 'Fundamentos y conceptos modernos de JavaScript.' })
  @IsOptional()
  @IsString()
  description?: string;
}
