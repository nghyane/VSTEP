import { env } from "@common/env";
import { drizzle } from "drizzle-orm/bun-sql";
import * as relations from "./relations";
import { table } from "./schema";

/**
 * Drizzle database client with Bun SQL native driver
 * Includes relational query support via db.query.*
 * @see https://orm.drizzle.team/docs/connect-bun-sql
 */
export const db = drizzle(env.DATABASE_URL, {
  schema: { ...table, ...relations },
});

export { table };
export { notDeleted, pagination } from "./helpers";
export type {
  Exam,
  ExamAnswer,
  ExamSession,
  ExamSubmission,
  NewExam,
  NewExamAnswer,
  NewExamSession,
  NewExamSubmission,
  NewOutbox,
  NewProcessedCallback,
  NewQuestion,
  NewQuestionVersion,
  NewRefreshToken,
  NewSubmission,
  NewSubmissionDetail,
  NewSubmissionEvent,
  NewUser,
  NewUserGoal,
  NewUserProgress,
  NewUserSkillScore,
  Outbox,
  ProcessedCallback,
  Question,
  QuestionVersion,
  RefreshToken,
  Submission,
  SubmissionDetail,
  SubmissionEvent,
  User,
  UserGoal,
  UserProgress,
  UserSkillScore,
} from "./schema";
