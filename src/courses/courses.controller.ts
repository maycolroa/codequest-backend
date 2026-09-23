import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { CreateCourseDto } from './dto/create-course.dto';
import { CreateCourseLessonDto } from './dto/create-course-lesson.dto';
import { CourseFiltersDto } from './dto/course-filters.dto';
import { GalaxyMapResponseDto } from './dto/galaxy-map-response.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateCourseLessonDto } from './dto/update-course-lesson.dto';
import { CoursesService } from './courses.service';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { UserCourseProgress } from './entities/user-course-progress.entity';

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

  @Get('galaxy')
  @ApiOperation({
    summary: 'Mapa 3D de galaxias con todos los cursos (activos e inactivos)',
  })
  @ApiResponse({ status: 200, type: GalaxyMapResponseDto })
  findGalaxy(): Promise<GalaxyMapResponseDto> {
    return this.coursesService.findGalaxy();
  }

  @Get('my-progress')
  @ApiOperation({ summary: 'Listar mis cursos inscritos y su avance' })
  findMyProgress(@GetUser('id') profileId: string): Promise<UserCourseProgress[]> {
    return this.coursesService.findMyProgress(profileId);
  }

  @Post(':id/enroll')
  @ApiOperation({ summary: 'Inscribirme a un curso' })
  @ApiParam({ name: 'id', format: 'uuid' })
  enroll(
    @GetUser('id') profileId: string,
    @Param('id', ParseUUIDPipe) courseId: string,
  ): Promise<UserCourseProgress> {
    return this.coursesService.enroll(profileId, courseId);
  }

  @Post(':id/lessons')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Crear una lección dentro de un curso' })
  @ApiParam({ name: 'id', format: 'uuid' })
  createLesson(
    @Param('id', ParseUUIDPipe) courseId: string,
    @Body() createCourseLessonDto: CreateCourseLessonDto,
  ) {
    return this.coursesService.createLesson(courseId, createCourseLessonDto);
  }

  @Get(':id/lessons')
  @ApiOperation({ summary: 'Listar las lecciones de un curso' })
  @ApiParam({ name: 'id', format: 'uuid' })
  findLessons(@Param('id', ParseUUIDPipe) courseId: string) {
    return this.coursesService.findLessons(courseId);
  }

  @Patch('lessons/:lessonId')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Editar una lección' })
  @ApiParam({ name: 'lessonId', format: 'uuid' })
  updateLesson(
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() updateCourseLessonDto: UpdateCourseLessonDto,
  ) {
    return this.coursesService.updateLesson(lessonId, updateCourseLessonDto);
  }

  @Delete('lessons/:lessonId')
  @UseGuards(SuperAdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una lección y recalcular avances' })
  @ApiParam({ name: 'lessonId', format: 'uuid' })
  removeLesson(@Param('lessonId', ParseUUIDPipe) lessonId: string): Promise<void> {
    return this.coursesService.removeLesson(lessonId);
  }

  @Post('lessons/:lessonId/complete')
  @ApiOperation({ summary: 'Registrar una lección completada y recalcular el avance' })
  @ApiParam({ name: 'lessonId', format: 'uuid' })
  completeLesson(
    @GetUser('id') profileId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
  ): Promise<UserCourseProgress> {
    return this.coursesService.completeLesson(profileId, lessonId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un curso activo por ID' })
  @ApiParam({ name: 'id', format: 'uuid' })
  findById(@Param('id', ParseUUIDPipe) id: string) {
    return this.coursesService.findById(id);
  }

  @Patch(':id')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Editar un curso' })
  @ApiParam({ name: 'id', format: 'uuid' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @UseGuards(SuperAdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar un curso' })
  @ApiParam({ name: 'id', format: 'uuid' })
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.coursesService.remove(id);
  }
}
