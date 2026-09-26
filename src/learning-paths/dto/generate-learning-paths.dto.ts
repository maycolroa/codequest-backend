import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayMaxSize, ArrayMinSize, IsArray, IsInt, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class GenerateLearningPathsDto {
  @ApiProperty({ type: [String], example: ['Desarrollo web', 'Inteligencia artificial'] })
  @IsArray() @ArrayMinSize(1) @ArrayMaxSize(8) @IsString({ each: true }) @MaxLength(80, { each: true })
  interests: string[];
  @ApiProperty({ example: 'Crear aplicaciones web con IA' })
  @IsString() @MinLength(3) @MaxLength(500) goals: string;
  @ApiProperty({ example: 'beginner' }) @IsString() @MaxLength(40) currentLevel: string;
  @ApiProperty({ minimum: 1, maximum: 60, example: 6 }) @IsInt() @Min(1) @Max(60) availableHoursPerWeek: number;
  @ApiPropertyOptional({ type: [String], example: ['TypeScript', 'Python'] })
  @IsArray() @IsString({ each: true }) @MaxLength(80, { each: true }) preferredTechnologies?: string[];
}
