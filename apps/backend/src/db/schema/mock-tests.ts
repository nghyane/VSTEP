import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { questionLevelEnum } from "./questions";
import { submissions } from "./submissions";
import { users } from "./users";

export const mockTestStatusEnum = pgEnum("mock_test_status", [
  "in_progress",
  "completed",
  "abandoned",
]);

export const mockTests = pgTable(
  "mock_tests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    level: questionLevelEnum("level").notNull(),
    blueprint: jsonb("blueprint").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    levelIdx: index("mock_tests_level_idx").on(table.level),
    activeIdx: index("mock_tests_active_idx")
      .on(table.level)
      .where(sql`${table.isActive} = true`),
  }),
);

export const mockTestSessions = pgTable(
  "mock_test_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    mockTestId: uuid("mock_test_id")
      .references(() => mockTests.id, { onDelete: "cascade" })
      .notNull(),
    status: mockTestStatusEnum("status").default("in_progress").notNull(),
    listeningScore: integer("listening_score"),
    readingScore: integer("reading_score"),
    writingScore: integer("writing_score"),
    speakingScore: integer("speaking_score"),
    overallExamScore: integer("overall_exam_score"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIdx: index("mock_test_sessions_user_idx").on(table.userId),
    statusIdx: index("mock_test_sessions_status_idx").on(table.status),
  }),
);

export const mockTestSessionAnswers = pgTable(
  "mock_test_session_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .references(() => mockTestSessions.id, { onDelete: "cascade" })
      .notNull(),
    questionId: uuid("question_id").notNull(),
    answer: jsonb("answer").notNull(),
    isCorrect: boolean("is_correct"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sessionIdx: index("mock_test_session_answers_session_idx").on(
      table.sessionId,
    ),
  }),
);

export const mockTestSessionSubmissions = pgTable(
  "mock_test_session_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .references(() => mockTestSessions.id, { onDelete: "cascade" })
      .notNull(),
    submissionId: uuid("submission_id")
      .references(() => submissions.id, { onDelete: "cascade" })
      .notNull(),
    skill: varchar("skill", { length: 10 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sessionIdx: index("mock_test_session_submissions_session_idx").on(
      table.sessionId,
    ),
    submissionIdx: index("mock_test_session_submissions_submission_idx").on(
      table.submissionId,
    ),
  }),
);

export type MockTest = typeof mockTests.$inferSelect;
export type NewMockTest = typeof mockTests.$inferInsert;
export type MockTestSession = typeof mockTestSessions.$inferSelect;
export type NewMockTestSession = typeof mockTestSessions.$inferInsert;
export type MockTestSessionAnswer = typeof mockTestSessionAnswers.$inferSelect;
export type NewMockTestSessionAnswer =
  typeof mockTestSessionAnswers.$inferInsert;
export type MockTestSessionSubmission =
  typeof mockTestSessionSubmissions.$inferSelect;
export type NewMockTestSessionSubmission =
  typeof mockTestSessionSubmissions.$inferInsert;
