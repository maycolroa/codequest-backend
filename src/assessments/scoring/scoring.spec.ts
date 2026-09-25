import { SkillLevel } from '../enums/skill-level.enum';
import { calculateScore, getSkillLevel } from './scoring';

describe('quiz scoring', () => {
  it.each([
    [0, SkillLevel.BEGINNER], [40, SkillLevel.BEGINNER], [41, SkillLevel.INTERMEDIATE],
    [75, SkillLevel.INTERMEDIATE], [76, SkillLevel.ADVANCED], [100, SkillLevel.ADVANCED],
  ])('assigns score %i to %s', (score, expectedLevel) => {
    expect(getSkillLevel(score)).toBe(expectedLevel);
  });

  it('weights correct answers by their difficulty', () => {
    expect(calculateScore([
      { difficulty: 1, isCorrect: true },
      { difficulty: 3, isCorrect: false },
    ])).toEqual({ score: 25, level: SkillLevel.BEGINNER, correctWeight: 1, totalWeight: 4 });
  });

  it('returns a beginner result for an empty assessment', () => {
    expect(calculateScore([])).toEqual({ score: 0, level: SkillLevel.BEGINNER, correctWeight: 0, totalWeight: 0 });
  });

  it('rejects invalid weights', () => {
    expect(() => calculateScore([{ difficulty: 0, isCorrect: true }])).toThrow(RangeError);
  });
});
