import { sql, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { users } from "./users";

export const submissionStatusEnum = pgEnum("submission_status", [
  "pending",
  "queued",
  "processing",
  "analyzing",
  "grading",
  "review_required",
  "completed",
  "failed",
]);

export const skillEnum = pgEnum("skill", [
  "listening",
  "reading",
  "writing",
  "speaking",
]);

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    questionId: uuid("question_id").notNull(),
    skill: skillEnum("skill").notNull(),
    status: submissionStatusEnum("status").default("pending").notNull(),
    score: integer("score"),
    band: integer("band"),
    confidenceScore: integer("confidence_score"),
    reviewRequired: boolean("review_required").default(false),
    isLate: boolean("is_late").default(false),
    deadlineAt: timestamp("deadline_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => ({
    userIdIdx: index("submissions_user_id_idx").on(table.userId),
    statusIdx: index("submissions_status_idx").on(table.status),
    userStatusIdx: index("submissions_user_status_idx").on(
      table.userId,
      table.status,
    ),
    reviewQueueIdx: index("submissions_review_queue_idx")
      .on(table.status, table.confidenceScore)
      .where(sql`${table.status} = 'review_required'`),
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
    eventAt: timestamp("event_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    data: jsonb("data"),
  },
  (table) => ({
    submissionEventIdx: index("submission_events_submission_idx").on(
      table.submissionId,
      table.eventAt,
    ),
  }),
);

export type Submission = typeof submissions.$inferSelect;
export type NewSubmission = typeof submissions.$inferInsert;
export type SubmissionDetail = typeof submissionDetails.$inferSelect;
export type NewSubmissionDetail = typeof submissionDetails.$inferInsert;
export type SubmissionEvent = typeof submissionEvents.$inferSelect;
export type NewSubmissionEvent = typeof submissionEvents.$inferInsert;
