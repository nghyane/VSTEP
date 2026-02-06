/**
 * Barrel export for all Drizzle schema tables
 * Centralizes table references for type-safe access across the application
 * @see https://orm.drizzle.team/docs/sql-schema-declaration
 */

// Exams
import { examAnswers, examSessions, examSubmissions, exams } from "./exams";
// Outbox Pattern
import { outbox, processedCallbacks } from "./outbox";
// Progress & Gamification
import { userGoals, userProgress, userSkillScores } from "./progress";
// Questions
import { questions, questionVersions } from "./questions";
// Submissions
import {
  submissionDetails,
  submissionEvents,
  submissions,
} from "./submissions";
// Auth & Users
import { refreshTokens, users } from "./users";

/**
 * Centralized table registry
 * Use this for type-safe table references in queries and typebox schemas
 * @example
 * db.select().from(table.users)
 */
export const table = {
  // Auth & Users
  users,
  refreshTokens,
  // Submissions
  submissions,
  submissionDetails,
  submissionEvents,
  // Questions
  questions,
  questionVersions,
  // Progress
  userProgress,
  userSkillScores,
  userGoals,
  // Exams
  exams,
  examSessions,
  examAnswers,
  examSubmissions,
  // Outbox
  outbox,
  processedCallbacks,
} as const;

// Export all tables for direct access
export {
  examAnswers,
  examSessions,
  examSubmissions,
  exams,
  outbox,
  processedCallbacks,
  questionVersions,
  questions,
  refreshTokens,
  submissionDetails,
  submissionEvents,
  submissions,
  userGoals,
  userProgress,
  userSkillScores,
  users,
};

// Export all types from schema files
export type {
  Exam,
  ExamAnswer,
  ExamSession,
  ExamSubmission,
  NewExam,
  NewExamAnswer,
  NewExamSession,
  NewExamSubmission,
} from "./exams";

export type {
  NewOutbox,
  NewProcessedCallback,
  Outbox,
  ProcessedCallback,
} from "./outbox";

export type {
  NewUserGoal,
  NewUserProgress,
  NewUserSkillScore,
  UserGoal,
  UserProgress,
  UserSkillScore,
} from "./progress";

export type {
  NewQuestion,
  NewQuestionVersion,
  Question,
  QuestionVersion,
} from "./questions";

export type {
  NewSubmission,
  NewSubmissionDetail,
  NewSubmissionEvent,
  Submission,
  SubmissionDetail,
  SubmissionEvent,
} from "./submissions";

export type {
  NewRefreshToken,
  NewUser,
  RefreshToken,
  User,
} from "./users";
