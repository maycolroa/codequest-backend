import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { CreateCourseDto } from './dto/create-course.dto';
import { CourseFiltersDto } from './dto/course-filters.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CoursesService } from './courses.service';

@ApiTags('Courses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Crear un curso' })
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

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

  @Patch(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Editar un curso' })
  @ApiParam({ name: 'id', format: 'uuid' })
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar un curso' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id') id: string): Promise<void> {
    return this.coursesService.remove(id);
  }
}