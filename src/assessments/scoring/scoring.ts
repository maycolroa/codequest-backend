import { SkillLevel } from '../enums/skill-level.enum';

export interface ScoreAnswer {
  difficulty: number;
  isCorrect: boolean;
}

export interface ScoreResult {
  score: number;
  level: SkillLevel;
  correctWeight: number;
  totalWeight: number;
}

export function getSkillLevel(score: number): SkillLevel {
  if (score <= 40) return SkillLevel.BEGINNER;
  if (score <= 75) return SkillLevel.INTERMEDIATE;
  return SkillLevel.ADVANCED;
}

/** Calculates a 0-100 weighted score. Difficulty must be a positive finite number. */
export function calculateScore(answers: readonly ScoreAnswer[]): ScoreResult {
  if (answers.length === 0) {
    return { score: 0, level: SkillLevel.BEGINNER, correctWeight: 0, totalWeight: 0 };
  }

  const totalWeight = answers.reduce((total, answer) => {
    if (!Number.isFinite(answer.difficulty) || answer.difficulty <= 0) {
      throw new RangeError('La dificultad de cada pregunta debe ser mayor que cero');
    }
    return total + answer.difficulty;
  }, 0);
  const correctWeight = answers
    .filter((answer) => answer.isCorrect)
    .reduce((total, answer) => total + answer.difficulty, 0);
  const score = Math.round((correctWeight / totalWeight) * 100);

  return { score, level: getSkillLevel(score), correctWeight, totalWeight };
}
