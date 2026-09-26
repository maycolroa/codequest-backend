import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateCourseProgressDto {
  @ApiProperty({ description: 'true para marcar el curso como completado; false para desmarcarlo', example: true })
  @IsBoolean()
  completed: boolean;
}
