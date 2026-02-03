import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "../common/env";

// Direct imports from schema files (no barrel files)
import {
  mockTestSessionAnswers,
  mockTestSessionSubmissions,
  mockTestSessions,
  mockTests,
} from "./schema/mock-tests";
import { outbox, processedCallbacks } from "./schema/outbox";
import { userGoals, userProgress, userSkillScores } from "./schema/progress";
import { questions, questionVersions } from "./schema/questions";
import {
  submissionDetails,
  submissionEvents,
  submissions,
} from "./schema/submissions";
import { refreshTokens, users } from "./schema/users";

const client = postgres(env.DATABASE_URL);

/**
 * Drizzle database client with all tables
 * Use this for all database operations
 */
export const db = drizzle(client, {
  schema: {
    users,
    refreshTokens,
    submissions,
    submissionDetails,
    submissionEvents,
    questions,
    questionVersions,
    outbox,
    processedCallbacks,
    userProgress,
    userSkillScores,
    userGoals,
    mockTests,
    mockTestSessions,
    mockTestSessionAnswers,
    mockTestSessionSubmissions,
  },
});

// Export tables for direct access when needed
export {
  mockTestSessionAnswers,
  mockTestSessionSubmissions,
  mockTestSessions,
  mockTests,
  outbox,
  processedCallbacks,
  userGoals,
  userProgress,
  userSkillScores,
  questions,
  questionVersions,
  submissionDetails,
  submissionEvents,
  submissions,
  refreshTokens,
  users,
};

// Export types from each schema file
export type {
  MockTest,
  MockTestSession,
  MockTestSessionAnswer,
  MockTestSessionSubmission,
  NewMockTest,
  NewMockTestSession,
  NewMockTestSessionAnswer,
  NewMockTestSessionSubmission,
} from "./schema/mock-tests";

export type {
  NewOutbox,
  NewProcessedCallback,
  Outbox,
  ProcessedCallback,
} from "./schema/outbox";

export type {
  NewUserGoal,
  NewUserProgress,
  NewUserSkillScore,
  UserGoal,
  UserProgress,
  UserSkillScore,
} from "./schema/progress";

export type {
  NewQuestion,
  NewQuestionVersion,
  Question,
  QuestionVersion,
} from "./schema/questions";

export type {
  NewSubmission,
  NewSubmissionDetail,
  NewSubmissionEvent,
  Submission,
  SubmissionDetail,
  SubmissionEvent,
} from "./schema/submissions";

export type {
  NewRefreshToken,
  NewUser,
  RefreshToken,
  User,
} from "./schema/users";
