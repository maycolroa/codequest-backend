import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';

import { GetUser } from '../auth/decorators/get-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/super-admin.guard';
import { AnswerQuestionDto } from './dto/answer-question.dto';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { AssessmentsService } from './assessments.service';
import { assertProfileAccess } from '../auth/utils/assert-profile-access';

@ApiTags('Assessments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly assessmentsService: AssessmentsService) {}

  @Get('skills')
  @ApiOperation({ summary: 'Listar skills activas disponibles para estudiantes' })
  listSkills() {
    return this.assessmentsService.findActiveSkills();
  }

  @Post('questions')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Crear una pregunta de evaluación para una skill' })
  createQuestion(@Body() dto: CreateAssessmentDto) {
    return this.assessmentsService.createQuestion(dto);
  }

  @Get('admin/skills')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Listar skills, incluidas las desactivadas' })
  listSkillsForAdmin() {
    return this.assessmentsService.findSkillsForAdmin();
  }

  @Post('admin/skills')
  @UseGuards(SuperAdminGuard)
  @ApiOperation({ summary: 'Crear una skill manualmente' })
  createSkill(@Body() dto: CreateSkillDto) {
    return this.assessmentsService.createSkill(dto);
  }

  @Patch('admin/skills/:skillId')
  @UseGuards(SuperAdminGuard)
  @ApiParam({ name: 'skillId', format: 'uuid' })
  @ApiOperation({ summary: 'Editar o reactivar una skill' })
  updateSkill(@Param('skillId', ParseUUIDPipe) skillId: string, @Body() dto: UpdateSkillDto) {
    return this.assessmentsService.updateSkill(skillId, dto);
  }

  @Delete('admin/skills/:skillId')
  @UseGuards(SuperAdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'skillId', format: 'uuid' })
  @ApiOperation({ summary: 'Desactivar una skill sin eliminar su historial' })
  removeSkill(@Param('skillId', ParseUUIDPipe) skillId: string): Promise<void> {
    return this.assessmentsService.removeSkill(skillId);
  }

  @Get('admin/skills/:skillId/questions')
  @UseGuards(SuperAdminGuard)
  @ApiParam({ name: 'skillId', format: 'uuid' })
  @ApiOperation({ summary: 'Listar preguntas y respuestas correctas para administración' })
  listQuestionsForAdmin(@Param('skillId', ParseUUIDPipe) skillId: string) {
    return this.assessmentsService.findQuestionsForAdmin(skillId);
  }

  @Get('admin/questions/:questionId')
  @UseGuards(SuperAdminGuard)
  @ApiParam({ name: 'questionId', format: 'uuid' })
  @ApiOperation({ summary: 'Obtener una pregunta para edición' })
  getQuestionForAdmin(@Param('questionId', ParseUUIDPipe) questionId: string) {
    return this.assessmentsService.findQuestionForAdmin(questionId);
  }

  @Patch('admin/questions/:questionId')
  @UseGuards(SuperAdminGuard)
  @ApiParam({ name: 'questionId', format: 'uuid' })
  @ApiOperation({ summary: 'Editar pregunta; las opciones solo cambian si no hay respuestas' })
  updateQuestion(@Param('questionId', ParseUUIDPipe) questionId: string, @Body() dto: UpdateAssessmentDto) {
    return this.assessmentsService.updateQuestion(questionId, dto);
  }

  @Delete('admin/questions/:questionId')
  @UseGuards(SuperAdminGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'questionId', format: 'uuid' })
  @ApiOperation({ summary: 'Desactivar una pregunta sin eliminar historial' })
  removeQuestion(@Param('questionId', ParseUUIDPipe) questionId: string): Promise<void> {
    return this.assessmentsService.removeQuestion(questionId);
  }

  @Post('users/:profileId/skills/:skillId/start')
  @ApiParam({ name: 'skillId', format: 'uuid' })
  @ApiOperation({ summary: 'Iniciar un cuestionario para una skill del perfil autenticado' })
  start(@GetUser('id') authenticatedProfileId: string, @Param('profileId', ParseUUIDPipe) profileId: string, @Param('skillId', ParseUUIDPipe) skillId: string) {
    assertProfileAccess(authenticatedProfileId, profileId);
    return this.assessmentsService.startAttempt(profileId, skillId);
  }

  @Post('users/:profileId/attempts/:attemptId/answers')
  @ApiParam({ name: 'attemptId', format: 'uuid' })
  @ApiOperation({ summary: 'Guardar una respuesta del cuestionario del perfil autenticado' })
  answer(@GetUser('id') authenticatedProfileId: string, @Param('profileId', ParseUUIDPipe) profileId: string, @Param('attemptId', ParseUUIDPipe) attemptId: string, @Body() dto: AnswerQuestionDto) {
    assertProfileAccess(authenticatedProfileId, profileId);
    return this.assessmentsService.saveAnswer(profileId, attemptId, dto);
  }

  @Post('users/:profileId/attempts/:attemptId/complete')
  @HttpCode(200)
  @ApiParam({ name: 'attemptId', format: 'uuid' })
  @ApiOperation({ summary: 'Calcular y persistir el resultado del cuestionario' })
  complete(@GetUser('id') authenticatedProfileId: string, @Param('profileId', ParseUUIDPipe) profileId: string, @Param('attemptId', ParseUUIDPipe) attemptId: string) {
    assertProfileAccess(authenticatedProfileId, profileId);
    return this.assessmentsService.completeAttempt(profileId, attemptId);
  }

  @Get('users/:profileId/attempts/:attemptId/result')
  @ApiParam({ name: 'attemptId', format: 'uuid' })
  @ApiOperation({ summary: 'Consultar el resultado de un cuestionario finalizado' })
  result(@GetUser('id') authenticatedProfileId: string, @Param('profileId', ParseUUIDPipe) profileId: string, @Param('attemptId', ParseUUIDPipe) attemptId: string) {
    assertProfileAccess(authenticatedProfileId, profileId);
    return this.assessmentsService.getResult(profileId, attemptId);
  }

  @Get('users/:profileId/my-skills')
  @ApiOperation({ summary: 'Consultar los niveles vigentes de mis skills' })
  currentLevels(@GetUser('id') authenticatedProfileId: string, @Param('profileId', ParseUUIDPipe) profileId: string) {
    assertProfileAccess(authenticatedProfileId, profileId);
    return this.assessmentsService.getCurrentSkillLevels(profileId);
  }
}
