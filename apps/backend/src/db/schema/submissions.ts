import type { SubmissionAnswer } from "@db/types/answers";
import type { Result } from "@db/types/grading";
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps } from "./columns";
import { skillEnum, vstepBandEnum } from "./enums";
import { questions } from "./questions";
import { users } from "./users";

export { skillEnum, vstepBandEnum };

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "processing",
  "completed",
  "review_pending",
  "failed",
]);

export const reviewPriorityEnum = pgEnum("review_priority", [
  "low",
  "medium",
  "high",
]);

export const gradingModeEnum = pgEnum("grading_mode", [
  "auto",
  "human",
  "hybrid",
]);

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    questionId: uuid("question_id")
      .references(() => questions.id, { onDelete: "restrict" })
      .notNull(),
    skill: skillEnum("skill").notNull(),
    status: submissionStatusEnum("status").default("pending").notNull(),
    score: numeric("score", { precision: 3, scale: 1, mode: "number" }),
    band: vstepBandEnum("band"),
    reviewPriority: reviewPriorityEnum("review_priority"),
    reviewerId: uuid("reviewer_id").references(() => users.id, {
      onDelete: "set null",
    }),
    gradingMode: gradingModeEnum("grading_mode"),
    auditFlag: boolean("audit_flag").default(false).notNull(),
    claimedBy: uuid("claimed_by").references(() => users.id, {
      onDelete: "set null",
    }),
    claimedAt: timestamp("claimed_at", { withTimezone: true, mode: "string" }),
    ...timestamps,
    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "string",
    }),
  },
  (table) => ({
    userIdIdx: index("submissions_user_id_idx").on(table.userId),
    skillIdx: index("submissions_skill_idx").on(table.skill),
    questionIdIdx: index("submissions_question_id_idx").on(table.questionId),
    statusIdx: index("submissions_status_idx").on(table.status),
    userStatusIdx: index("submissions_user_status_idx").on(
      table.userId,
      table.status,
    ),
    reviewQueueIdx: index("submissions_review_queue_idx")
      .on(table.status)
      .where(sql`${table.status} = 'review_pending'`),
    userHistoryIdx: index("submissions_user_history_idx").on(
      table.userId,
      table.createdAt,
    ),
  }),
);

export const submissionDetails = pgTable("submission_details", {
  submissionId: uuid("submission_id")
    .references(() => submissions.id, { onDelete: "cascade" })
    .primaryKey(),
  answer: jsonb("answer").$type<SubmissionAnswer>().notNull(),
  result: jsonb("result").$type<Result | null>(),
  feedback: varchar("feedback", { length: 10000 }),
  ...timestamps,
});

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type SubmissionDetail = typeof submissionDetails.$inferSelect;
export type NewSubmissionDetail = typeof submissionDetails.$inferInsert;
