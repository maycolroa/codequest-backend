import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { GenerateLearningPathsDto } from './dto/generate-learning-paths.dto';
import { LearningPathsService } from './learning-paths.service';
import { UpdateCourseProgressDto } from './dto/update-course-progress.dto';
import { assertProfileAccess } from '../auth/utils/assert-profile-access';

@ApiTags('Learning Paths') @ApiBearerAuth() @UseGuards(JwtAuthGuard) @Controller('learning-paths')
export class LearningPathsController {
  constructor(private readonly service: LearningPathsService) {}
  @Post('users/:profileId/generate') @ApiOperation({ summary: 'Generar y guardar rutas personalizadas; el perfil debe coincidir con el JWT' })
  generate(@GetUser('id') authenticatedProfileId: string, @Param('profileId', ParseUUIDPipe) profileId: string, @Body() dto: GenerateLearningPathsDto) {
    assertProfileAccess(authenticatedProfileId, profileId);
    return this.service.generate(profileId, dto);
  }
  @Get('users/:profileId') @ApiOperation({ summary: 'Listar rutas del perfil autenticado' })
  findAll(@GetUser('id') authenticatedProfileId: string, @Param('profileId', ParseUUIDPipe) profileId: string) {
    assertProfileAccess(authenticatedProfileId, profileId);
    return this.service.findAllByUser(profileId);
  }
  @Get('users/:profileId/:id') @ApiParam({ name: 'id', format: 'uuid' }) @ApiOperation({ summary: 'Ver detalle de una ruta del perfil autenticado' })
  findOne(@GetUser('id') authenticatedProfileId: string, @Param('profileId', ParseUUIDPipe) profileId: string, @Param('id', ParseUUIDPipe) id: string) {
    assertProfileAccess(authenticatedProfileId, profileId);
    return this.service.findOne(profileId, id);
  }
  @Patch('users/:profileId/:pathId/courses/:courseId/lessons/:lessonId/progress') @ApiOperation({ summary: 'Marcar o desmarcar una lección de una ruta del perfil autenticado' })
  updateLessonProgress(
    @GetUser('id') authenticatedProfileId: string,
    @Param('profileId', ParseUUIDPipe) profileId: string,
    @Param('pathId', ParseUUIDPipe) pathId: string,
    @Param('courseId', ParseUUIDPipe) courseId: string,
    @Param('lessonId', ParseUUIDPipe) lessonId: string,
    @Body() dto: UpdateCourseProgressDto,
  ) {
    assertProfileAccess(authenticatedProfileId, profileId);
    return this.service.updateLessonProgress(profileId, pathId, courseId, lessonId, dto);
  }
  @Delete('users/:profileId/:id') @HttpCode(HttpStatus.NO_CONTENT) @ApiParam({ name: 'id', format: 'uuid' }) @ApiOperation({ summary: 'Eliminar una ruta propia' })
  remove(@GetUser('id') authenticatedProfileId: string, @Param('profileId', ParseUUIDPipe) profileId: string, @Param('id', ParseUUIDPipe) id: string): Promise<void> {
    assertProfileAccess(authenticatedProfileId, profileId);
    return this.service.remove(profileId, id);
  }
}
