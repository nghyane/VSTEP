import { env } from "@common/env";
import { drizzle } from "drizzle-orm/bun-sql";
import { table } from "./schema";

/**
 * Drizzle database client with Bun SQL native driver
 * Fastest PostgreSQL driver for Bun runtime (Zig-based, built-in)
 * Uses barrel export for centralized schema access
 * @see https://orm.drizzle.team/docs/connect-bun-sql
 */
export const db = drizzle(env.DATABASE_URL, { schema: table });

// Re-export table registry for direct access
export { table };

// Re-export all types from schema barrel
export type {
  MockTest,
  MockTestSession,
  MockTestSessionAnswer,
  MockTestSessionSubmission,
  NewMockTest,
  NewMockTestSession,
  NewMockTestSessionAnswer,
  NewMockTestSessionSubmission,
  NewOutbox,
  NewProcessedCallback,
  Outbox,
  ProcessedCallback,
  NewUserGoal,
  NewUserProgress,
  NewUserSkillScore,
  UserGoal,
  UserProgress,
  UserSkillScore,
  NewQuestion,
  NewQuestionVersion,
  Question,
  QuestionVersion,
  NewSubmission,
  NewSubmissionDetail,
  NewSubmissionEvent,
  Submission,
  SubmissionDetail,
  SubmissionEvent,
  NewRefreshToken,
  NewUser,
  RefreshToken,
  User,
} from "./schema";
