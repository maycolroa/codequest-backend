import 'dotenv/config';
import { DataSource } from 'typeorm';

import { Profile } from '../entities/profile.entity';
import { CreateProfiles1726000000000 } from '../migrations/1726000000000-CreateProfiles';
import { AddLocalAuthentication1726000000001 } from '../migrations/1726000000001-AddLocalAuthentication';
import { AddSuperAdminRole1726000000003 } from '../migrations/1726000000003-AddSuperAdminRole';
import { CreateCourses1726000000002 } from '../../courses/migrations/1726000000002-CreateCourses';
import { Course } from '../../courses/entities/course.entity';
import { AddCourseCatalogMetadata1726000000004 } from '../../courses/migrations/1726000000004-AddCourseCatalogMetadata';
import { CreateUserCourseProgress1726000000005 } from '../../courses/migrations/1726000000005-CreateUserCourseProgress';
import { SeedDevTallesCourses1726000000006 } from '../../courses/migrations/1726000000006-SeedDevTallesCourses';
import { UserCourseProgress } from '../../courses/entities/user-course-progress.entity';
import { CourseLesson } from '../../courses/entities/course-lesson.entity';
import { UserLessonProgress } from '../../courses/entities/user-lesson-progress.entity';
import { CreateCourseLessonsAndAutomaticProgress1726000000007 } from '../../courses/migrations/1726000000007-CreateCourseLessonsAndAutomaticProgress';
import { AddCourseGalaxyFields1726000000008 } from '../../courses/migrations/1726000000008-AddCourseGalaxyFields';
import { ClassifyCoursesIntoGalaxies1726000000009 } from '../../courses/migrations/1726000000009-ClassifyCoursesIntoGalaxies';
import { Skill } from '../../assessments/entities/skill.entity';
import { Question } from '../../assessments/entities/question.entity';
import { QuestionOption } from '../../assessments/entities/question-option.entity';
import { QuizAttempt } from '../../assessments/entities/quiz-attempt.entity';
import { QuizAnswer } from '../../assessments/entities/quiz-answer.entity';
import { CreateAssessments1726000000008 } from '../../assessments/migrations/1726000000008-CreateAssessments';
import { QuizAttemptQuestion } from '../../assessments/entities/quiz-attempt-question.entity';
import { CreateQuizAttemptQuestionSnapshots1726000000009 } from '../../assessments/migrations/1726000000009-CreateQuizAttemptQuestionSnapshots';
import { SeedInitialAssessmentQuestions1726000000010 } from '../../assessments/migrations/1726000000010-SeedInitialAssessmentQuestions';
import { LearningPath } from '../../learning-paths/entities/learning-path.entity';
import { UserAssessment } from '../../learning-paths/entities/user-assessment.entity';
import { CreateLearningPaths1726000000011 } from '../../learning-paths/migrations/1726000000011-CreateLearningPaths';
import { UseLessonProgress1726000000012 } from '../../learning-paths/migrations/1726000000012-UseLessonProgress';
import { SeedCourseLessons1726000000013 } from '../../courses/migrations/1726000000013-SeedCourseLessons';
import { AddCourseCategoryToProgress1726000000014 } from '../../courses/migrations/1726000000014-AddCourseCategoryToProgress';
import { AddLessonDurations1726000000015 } from '../../courses/migrations/1726000000015-AddLessonDurations';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL no está definida');
}

const authDataSource = new DataSource({
  type: 'postgres',
  url: databaseUrl,
  entities: [Profile, Course, CourseLesson, UserCourseProgress, UserLessonProgress, Skill, Question, QuestionOption, QuizAttempt, QuizAttemptQuestion, QuizAnswer, LearningPath, UserAssessment],
  migrations: [
    CreateProfiles1726000000000,
    AddLocalAuthentication1726000000001,
    AddSuperAdminRole1726000000003,
    CreateCourses1726000000002,
    AddCourseCatalogMetadata1726000000004,
    CreateUserCourseProgress1726000000005,
    SeedDevTallesCourses1726000000006,
    CreateCourseLessonsAndAutomaticProgress1726000000007,
    AddCourseGalaxyFields1726000000008,
    ClassifyCoursesIntoGalaxies1726000000009,
    CreateAssessments1726000000008,
    CreateQuizAttemptQuestionSnapshots1726000000009,
    SeedInitialAssessmentQuestions1726000000010,
    CreateLearningPaths1726000000011,
    UseLessonProgress1726000000012,
    SeedCourseLessons1726000000013,
    AddCourseCategoryToProgress1726000000014,
    AddLessonDurations1726000000015,
  ],
  synchronize: false,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

export default authDataSource;
