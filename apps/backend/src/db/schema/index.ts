/**
 * Barrel export for all Drizzle schema tables
 * Centralizes table references for type-safe access across the application
 * @see https://orm.drizzle.team/docs/sql-schema-declaration
 */

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
} as const;

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

export type { UserProgress } from "./progress";
