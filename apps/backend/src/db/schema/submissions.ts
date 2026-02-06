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
import { questions } from "./questions";
import { users } from "./users";

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

export const skillEnum = pgEnum("skill", [
  "listening",
  "reading",
  "writing",
  "speaking",
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

export const vstepBandEnum = pgEnum("vstep_band", [
  "A1",
  "A2",
  "B1",
  "B2",
  "C1",
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
    reviewPending: boolean("review_pending").default(false),
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
    claimedAt: timestamp("claimed_at", { withTimezone: true }),
    deadline: timestamp("deadline", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index("submissions_user_id_idx").on(table.userId),
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
    requestIdUnique: uniqueIndex("submissions_request_id_unique").on(
      table.requestId,
    ),
  }),
);

export const submissionDetails = pgTable("submission_details", {
  submissionId: uuid("submission_id")
    .references(() => submissions.id, { onDelete: "cascade" })
    .primaryKey(),
  answer: jsonb("answer").notNull(),
  result: jsonb("result"),
  feedback: varchar("feedback"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const submissionEvents = pgTable(
  "submission_events",
  {
    eventId: uuid("event_id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .references(() => submissions.id, { onDelete: "cascade" })
      .notNull(),
    kind: varchar("kind", { length: 50 }).notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true })
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
