import type { SubmissionAnswer } from "@db/types/answers";
import type { GradingResult } from "@db/types/grading";
import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { timestamps, timestampsWithSoftDelete } from "./columns";
import { skillEnum, vstepBandEnum } from "./enums";
import { questions } from "./questions";
import { users } from "./users";

export { skillEnum, vstepBandEnum };

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "queued",
  "processing",
  "completed",
  "review_pending",
  "error",
  "retrying",
  "failed",
]);

export const reviewPriorityEnum = pgEnum("review_priority", [
  "low",
  "medium",
  "high",
  "critical",
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
    confidence: integer("confidence"),
    isLate: boolean("is_late").default(false),
    attempt: integer("attempt").default(1).notNull(),
    requestId: uuid("request_id"),
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
    deadline: timestamp("deadline", { withTimezone: true, mode: "string" }),
    ...timestampsWithSoftDelete,
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
      .on(table.status, table.confidence)
      .where(
        sql`${table.status} = 'review_pending' AND ${table.deletedAt} IS NULL`,
      ),
    userHistoryIdx: index("submissions_user_history_idx")
      .on(table.userId, table.createdAt)
      .where(sql`${table.deletedAt} IS NULL`),
    requestIdUnique: uniqueIndex("submissions_request_id_unique")
      .on(table.requestId)
      .where(sql`${table.requestId} IS NOT NULL`),
  }),
);

export const submissionDetails = pgTable("submission_details", {
  submissionId: uuid("submission_id")
    .references(() => submissions.id, { onDelete: "cascade" })
    .primaryKey(),
  answer: jsonb("answer").$type<SubmissionAnswer>().notNull(),
  result: jsonb("result").$type<GradingResult | null>(),
  feedback: varchar("feedback", { length: 10000 }),
  ...timestamps,
});

// TODO(P2): submissionEvents table is defined but never populated
//   - Insert events on every status transition, grading, claim/release
//   - Enables audit trail + materialized view reconstruction
export const submissionEvents = pgTable(
  "submission_events",
  {
    eventId: uuid("event_id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .references(() => submissions.id, { onDelete: "cascade" })
      .notNull(),
    kind: varchar("kind", { length: 50 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    data: jsonb("data"),
  },
  (table) => ({
    submissionEventIdx: index("submission_events_submission_idx").on(
      table.submissionId,
      table.occurredAt,
    ),
  }),
);

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type SubmissionDetail = typeof submissionDetails.$inferSelect;
export type NewSubmissionDetail = typeof submissionDetails.$inferInsert;
export type SubmissionEvent = typeof submissionEvents.$inferSelect;
export type NewSubmissionEvent = typeof submissionEvents.$inferInsert;
