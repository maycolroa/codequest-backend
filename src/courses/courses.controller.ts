import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CourseFiltersDto } from './dto/course-filters.dto';
import { CoursesService } from './courses.service';

@ApiTags('Courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar cursos activos con filtros opcionales' })
  findAll(@Query() filters: CourseFiltersDto) {
    return this.coursesService.findAll(filters);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Listar categorías de cursos activos' })
  getCategories() {
    return this.coursesService.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un curso activo por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  findById(@Param('id') id: string) {
    return this.coursesService.findById(id);
  }
}