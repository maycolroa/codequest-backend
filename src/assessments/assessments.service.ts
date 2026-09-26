import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { AnswerQuestionDto } from './dto/answer-question.dto';
import { CreateAssessmentDto } from './dto/create-assessment.dto';
import { CreateSkillDto } from './dto/create-skill.dto';
import { UpdateAssessmentDto } from './dto/update-assessment.dto';
import { UpdateSkillDto } from './dto/update-skill.dto';
import { QuestionOption } from './entities/question-option.entity';
import { Question } from './entities/question.entity';
import { QuizAnswer } from './entities/quiz-answer.entity';
import { QuizAttempt } from './entities/quiz-attempt.entity';
import { QuizAttemptQuestion } from './entities/quiz-attempt-question.entity';
import { Skill } from './entities/skill.entity';
import { QuizAttemptStatus } from './enums/quiz-attempt-status.enum';
import { calculateScore } from './scoring/scoring';

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(Skill) private readonly skillsRepository: Repository<Skill>,
    @InjectRepository(Question) private readonly questionsRepository: Repository<Question>,
    @InjectRepository(QuizAttempt) private readonly attemptsRepository: Repository<QuizAttempt>,
    @InjectRepository(QuizAnswer) private readonly answersRepository: Repository<QuizAnswer>,
    private readonly dataSource: DataSource,
  ) {}

  async createQuestion(dto: CreateAssessmentDto): Promise<Question> {
    const skill = await this.skillsRepository.findOne({ where: { id: dto.skillId, isActive: true } });
    if (!skill) throw new NotFoundException('Skill no encontrada');
    this.validateOptions(dto.options);
    return this.dataSource.transaction(async (manager) => {
      const question = await manager.getRepository(Question).save(manager.getRepository(Question).create({
        skillId: dto.skillId, text: dto.text, type: dto.type, difficulty: dto.difficulty,
      }));
      const optionsRepository = manager.getRepository(QuestionOption);
      await optionsRepository.save(dto.options.map((option) => optionsRepository.create({
        text: option.text,
        isCorrect: option.isCorrect,
        position: option.position,
        questionId: question.id,
      })));
      return manager.getRepository(Question).findOneOrFail({ where: { id: question.id }, relations: { options: true } });
    });
  }

  findSkillsForAdmin(): Promise<Skill[]> {
    return this.skillsRepository.find({ order: { name: 'ASC' } });
  }

  async createSkill(dto: CreateSkillDto): Promise<Skill> {
    try {
      return await this.skillsRepository.save(this.skillsRepository.create({
        name: dto.name.trim(), slug: dto.slug, description: dto.description?.trim() ?? null,
      }));
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) throw new ConflictException('Ya existe una skill con ese nombre o slug');
      throw error;
    }
  }

  async updateSkill(skillId: string, dto: UpdateSkillDto): Promise<Skill> {
    const skill = await this.findSkillForAdmin(skillId);
    if (dto.name !== undefined) skill.name = dto.name.trim();
    if (dto.slug !== undefined) skill.slug = dto.slug;
    if (dto.description !== undefined) skill.description = dto.description.trim();
    if (dto.isActive !== undefined) skill.isActive = dto.isActive;
    try {
      return await this.skillsRepository.save(skill);
    } catch (error: unknown) {
      if (this.isUniqueViolation(error)) throw new ConflictException('Ya existe una skill con ese nombre o slug');
      throw error;
    }
  }

  async removeSkill(skillId: string): Promise<void> {
    const skill = await this.findSkillForAdmin(skillId);
    skill.isActive = false;
    await this.skillsRepository.save(skill);
  }

  async findQuestionsForAdmin(skillId: string): Promise<Question[]> {
    await this.findSkillForAdmin(skillId);
    return this.questionsRepository.find({
      where: { skillId }, relations: { options: true }, order: { createdAt: 'DESC', options: { position: 'ASC' } },
    });
  }

  async findQuestionForAdmin(questionId: string): Promise<Question> {
    const question = await this.questionsRepository.findOne({
      where: { id: questionId }, relations: { options: true },
    });
    if (!question) throw new NotFoundException('Pregunta no encontrada');
    return question;
  }

  async updateQuestion(questionId: string, dto: UpdateAssessmentDto): Promise<Question> {
    return this.dataSource.transaction(async (manager) => {
      const questionsRepository = manager.getRepository(Question);
      const question = await questionsRepository.findOne({ where: { id: questionId } });
      if (!question) throw new NotFoundException('Pregunta no encontrada');
      if (dto.options) {
        this.validateOptions(dto.options);
        const answerCount = await manager.getRepository(QuizAnswer).count({ where: { questionId } });
        if (answerCount > 0) {
          throw new ConflictException('No puedes reemplazar opciones de una pregunta que ya fue respondida');
        }
        const optionsRepository = manager.getRepository(QuestionOption);
        await optionsRepository.delete({ questionId });
        await optionsRepository.save(dto.options.map((option) => optionsRepository.create({
          questionId, text: option.text, isCorrect: option.isCorrect, position: option.position,
        })));
      }
      if (dto.text !== undefined) question.text = dto.text;
      if (dto.type !== undefined) question.type = dto.type;
      if (dto.difficulty !== undefined) question.difficulty = dto.difficulty;
      if (dto.isActive !== undefined) question.isActive = dto.isActive;
      await questionsRepository.save(question);
      return questionsRepository.findOneOrFail({ where: { id: questionId }, relations: { options: true } });
    });
  }

  async removeQuestion(questionId: string): Promise<void> {
    const question = await this.findQuestionForAdmin(questionId);
    question.isActive = false;
    await this.questionsRepository.save(question);
  }

  async startAttempt(profileId: string, skillId: string) {
    const skill = await this.skillsRepository.findOne({ where: { id: skillId, isActive: true } });
    if (!skill) throw new NotFoundException('Skill no encontrada');
    const pending = await this.attemptsRepository.findOne({ where: { profileId, skillId, status: QuizAttemptStatus.IN_PROGRESS } });
    if (pending) throw new ConflictException('Ya tienes un cuestionario en progreso para esta skill');

    const questions = await this.questionsRepository.find({
      where: { skillId, isActive: true }, relations: { options: true }, order: { createdAt: 'ASC', options: { position: 'ASC' } },
    });
    if (questions.length === 0) throw new ConflictException('Esta skill aún no tiene preguntas disponibles');

    const attempt = await this.dataSource.transaction(async (manager) => {
      const attemptsRepository = manager.getRepository(QuizAttempt);
      const newAttempt = await attemptsRepository.save(attemptsRepository.create({
        profileId, skillId, questionIds: questions.map((question) => question.id),
      }));
      const snapshotsRepository = manager.getRepository(QuizAttemptQuestion);
      const snapshots = questions.map((question) => {
        const correctOption = question.options.find((option) => option.isCorrect);
        if (!correctOption) throw new ConflictException('Una pregunta disponible no tiene respuesta correcta');
        return snapshotsRepository.create({
          attemptId: newAttempt.id,
          questionId: question.id,
          questionText: question.text,
          type: question.type,
          difficulty: question.difficulty,
          correctOptionId: correctOption.id,
          optionsSnapshot: question.options.map(({ id, text, position }) => ({ id, text, position })),
        });
      });
      await snapshotsRepository.save(snapshots);
      return newAttempt;
    });
    return {
      attemptId: attempt.id,
      skill: { id: skill.id, name: skill.name, slug: skill.slug },
      questions: questions.map((question) => ({
        id: question.id, text: question.text, type: question.type, difficulty: question.difficulty,
        options: question.options.map(({ id, text, position }) => ({ id, text, position })),
      })),
    };
  }

  async saveAnswer(profileId: string, attemptId: string, dto: AnswerQuestionDto): Promise<QuizAnswer> {
    return this.dataSource.transaction(async (manager) => {
      const attempt = await this.findOwnedAttempt(manager.getRepository(QuizAttempt), profileId, attemptId);
      this.ensureInProgress(attempt);
      const snapshot = await manager.getRepository(QuizAttemptQuestion).findOne({
        where: { attemptId, questionId: dto.questionId },
      });
      if (!snapshot) {
        throw new NotFoundException('La pregunta no pertenece a este cuestionario');
      }
      if (!snapshot.optionsSnapshot.some((option) => option.id === dto.selectedOptionId)) {
        throw new NotFoundException('La opción no pertenece a la pregunta indicada');
      }
      const repository = manager.getRepository(QuizAnswer);
      const answer = await repository.findOne({ where: { attemptId, questionId: dto.questionId } });
      return repository.save(answer
        ? Object.assign(answer, { selectedOptionId: dto.selectedOptionId })
        : repository.create({ attemptId, questionId: dto.questionId, selectedOptionId: dto.selectedOptionId }));
    });
  }

  async completeAttempt(profileId: string, attemptId: string): Promise<QuizAttempt> {
    return this.dataSource.transaction(async (manager) => {
      const attempts = manager.getRepository(QuizAttempt);
      const attempt = await this.findOwnedAttempt(attempts, profileId, attemptId);
      this.ensureInProgress(attempt);
      const questions = await manager.getRepository(QuizAttemptQuestion).find({ where: { attemptId } });
      const answers = await manager.getRepository(QuizAnswer).find({ where: { attemptId } });
      if (questions.length !== attempt.questionIds.length || answers.length !== attempt.questionIds.length) {
        throw new ConflictException('Debes responder todas las preguntas antes de finalizar');
      }
      const selectedByQuestion = new Map(answers.map((answer) => [answer.questionId, answer.selectedOptionId]));
      const result = calculateScore(questions.map((question) => ({
        difficulty: question.difficulty,
        isCorrect: question.correctOptionId === selectedByQuestion.get(question.questionId),
      })));
      attempt.status = QuizAttemptStatus.COMPLETED;
      attempt.score = result.score;
      attempt.level = result.level;
      attempt.completedAt = new Date();
      return attempts.save(attempt);
    });
  }

  async getResult(profileId: string, attemptId: string): Promise<QuizAttempt> {
    const attempt = await this.findOwnedAttempt(this.attemptsRepository, profileId, attemptId, { skill: true });
    if (attempt.status !== QuizAttemptStatus.COMPLETED) throw new ConflictException('El cuestionario aún no ha finalizado');
    return attempt;
  }

  async getCurrentSkillLevels(profileId: string) {
    return this.attemptsRepository.createQueryBuilder('attempt')
      .innerJoinAndSelect('attempt.skill', 'skill')
      .where('attempt.profile_id = :profileId', { profileId })
      .andWhere('attempt.status = :status', { status: QuizAttemptStatus.COMPLETED })
      .andWhere(`attempt.id IN (${this.attemptsRepository.createQueryBuilder('latest')
        .select('DISTINCT ON (latest.skill_id) latest.id')
        .where('latest.profile_id = :profileId', { profileId })
        .andWhere('latest.status = :status', { status: QuizAttemptStatus.COMPLETED })
        .orderBy('latest.skill_id').addOrderBy('latest.completed_at', 'DESC').addOrderBy('latest.created_at', 'DESC').getQuery()})`)
      .orderBy('skill.name', 'ASC').getMany();
  }

  private async findOwnedAttempt(repository: Repository<QuizAttempt>, profileId: string, attemptId: string, relations?: { skill: true }): Promise<QuizAttempt> {
    const attempt = await repository.findOne({ where: { id: attemptId }, relations });
    if (!attempt) throw new NotFoundException('Intento no encontrado');
    if (attempt.profileId !== profileId) throw new ForbiddenException('No puedes acceder al cuestionario de otro usuario');
    return attempt;
  }

  private ensureInProgress(attempt: QuizAttempt): void {
    if (attempt.status !== QuizAttemptStatus.IN_PROGRESS) throw new ConflictException('Este cuestionario ya fue finalizado');
  }

  private async findSkillForAdmin(skillId: string): Promise<Skill> {
    const skill = await this.skillsRepository.findOne({ where: { id: skillId } });
    if (!skill) throw new NotFoundException('Skill no encontrada');
    return skill;
  }

  private validateOptions(options: ReadonlyArray<{ isCorrect: boolean; position: number }>): void {
    if (options.filter((option) => option.isCorrect).length !== 1) {
      throw new ConflictException('Una pregunta de opción única debe tener exactamente una respuesta correcta');
    }
    if (new Set(options.map((option) => option.position)).size !== options.length) {
      throw new ConflictException('Las posiciones de las opciones deben ser únicas');
    }
  }

  private isUniqueViolation(error: unknown): error is { code: string } {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === '23505';
  }
}
