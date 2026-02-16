/**
 * Barrel export for all Drizzle schema tables
 * Centralizes table references for type-safe access across the application
 * @see https://orm.drizzle.team/docs/sql-schema-declaration
 */

import { classes, classMembers, instructorFeedback } from "./classes";
import { examAnswers, examSessions, examSubmissions, exams } from "./exams";
import { knowledgePoints, questionKnowledgePoints } from "./knowledge-points";
import {
  userGoals,
  userKnowledgeProgress,
  userProgress,
  userSkillScores,
} from "./progress";
import { questions } from "./questions";
import { submissionDetails, submissions } from "./submissions";
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
  questions,
  knowledgePoints,
  questionKnowledgePoints,
  userProgress,
  userSkillScores,
  userGoals,
  userKnowledgeProgress,
  exams,
  examSessions,
  examAnswers,
  examSubmissions,
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
  knowledgePoints,
  questionKnowledgePoints,
  questions,
  refreshTokens,
  submissionDetails,
  submissions,
  userGoals,
  userKnowledgeProgress,
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
export type {
  KnowledgePoint,
  NewKnowledgePoint,
  QuestionKnowledgePoint,
} from "./knowledge-points";
export type {
  NewUserKnowledgeProgress,
  UserKnowledgeProgress,
  UserProgress,
} from "./progress";
export type { NewQuestion, Question } from "./questions";
