/**
 * Barrel export for all Drizzle schema tables
 * Centralizes table references for type-safe access across the application
 * @see https://orm.drizzle.team/docs/sql-schema-declaration
 */

import { classes, classMembers, instructorFeedback } from "./classes";
import { examAnswers, examSessions, examSubmissions, exams } from "./exams";
import { knowledgePoints, questionKnowledgePoints } from "./knowledge-points";
import { deviceTokens, notifications } from "./notifications";
import {
  userGoals,
  userKnowledgeProgress,
  userPlacements,
  userProgress,
  userSkillScores,
} from "./progress";
import { questions } from "./questions";
import { submissionDetails, submissions } from "./submissions";
import { refreshTokens, users } from "./users";
import {
  userVocabularyProgress,
  vocabularyTopics,
  vocabularyWords,
} from "./vocabulary";

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
  userPlacements,
  userKnowledgeProgress,
  exams,
  examSessions,
  examAnswers,
  examSubmissions,
  classes,
  classMembers,
  instructorFeedback,
  vocabularyTopics,
  vocabularyWords,
  userVocabularyProgress,
  notifications,
  deviceTokens,
} as const;

export {
  classMembers,
  classes,
  deviceTokens,
  examAnswers,
  examSessions,
  examSubmissions,
  exams,
  instructorFeedback,
  knowledgePoints,
  notifications,
  questionKnowledgePoints,
  questions,
  refreshTokens,
  submissionDetails,
  submissions,
  userGoals,
  userPlacements,
  userKnowledgeProgress,
  userProgress,
  userSkillScores,
  userVocabularyProgress,
  users,
  vocabularyTopics,
  vocabularyWords,
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
  DeviceToken,
  NewDeviceToken,
  NewNotification,
  Notification,
} from "./notifications";
export type {
  NewUserKnowledgeProgress,
  NewUserPlacement,
  UserKnowledgeProgress,
  UserPlacement,
  UserProgress,
} from "./progress";
export type { NewQuestion, Question } from "./questions";
export type {
  NewUserVocabularyProgress,
  NewVocabularyTopic,
  NewVocabularyWord,
  UserVocabularyProgress,
  VocabularyTopic,
  VocabularyWord,
} from "./vocabulary";
