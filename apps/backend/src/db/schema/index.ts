/**
 * Barrel export for all Drizzle schema tables
 * Centralizes table references for type-safe access across the application
 * @see https://orm.drizzle.team/docs/sql-schema-declaration
 */

import { classes, classMembers, instructorFeedback } from "./classes";
import { examAnswers, examSessions, examSubmissions, exams } from "./exams";
import { outbox, processedCallbacks } from "./outbox";
import { userGoals, userProgress, userSkillScores } from "./progress";
import { questions, questionVersions } from "./questions";
import {
  submissionDetails,
  submissionEvents,
  submissions,
} from "./submissions";
import { refreshTokens, users } from "./users";

/**
 * Centralized table registry
 * Use this for type-safe table references in queries and typebox schemas
 * @example
 * db.select().from(table.users)
 */
export const table = {
  users,
  refreshTokens,
  submissions,
  submissionDetails,
  submissionEvents,
  questions,
  questionVersions,
  userProgress,
  userSkillScores,
  userGoals,
  exams,
  examSessions,
  examAnswers,
  examSubmissions,
  outbox,
  processedCallbacks,
  classes,
  classMembers,
  instructorFeedback,
} as const;

export {
  classMembers,
  classes,
  examAnswers,
  examSessions,
  examSubmissions,
  exams,
  instructorFeedback,
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

export type {
  Class,
  ClassMember,
  InstructorFeedback,
  NewClass,
  NewClassMember,
  NewInstructorFeedback,
} from "./classes";
export type { UserProgress } from "./progress";
