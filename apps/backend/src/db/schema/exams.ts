import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { questionLevelEnum, questions } from "./questions";
import { skillEnum, submissions } from "./submissions";
import { users } from "./users";

export const examStatusEnum = pgEnum("exam_status", [
  "in_progress",
  "submitted",
  "completed",
  "abandoned",
]);

export const exams = pgTable(
  "exams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    level: questionLevelEnum("level").notNull(),
    blueprint: jsonb("blueprint").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (table) => ({
    levelIdx: index("exams_level_idx").on(table.level),
    activeIdx: index("exams_active_idx")
      .on(table.level)
      .where(sql`${table.isActive} = true AND ${table.deletedAt} IS NULL`),
  }),
);

export const examSessions = pgTable(
  "exam_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => users.id, { onDelete: "cascade" })
      .notNull(),
    examId: uuid("exam_id")
      .references(() => exams.id, { onDelete: "restrict" })
      .notNull(),
    status: examStatusEnum("status").default("in_progress").notNull(),
    listeningScore: numeric("listening_score", {
      precision: 3,
      scale: 1,
      mode: "number",
    }),
    readingScore: numeric("reading_score", {
      precision: 3,
      scale: 1,
      mode: "number",
    }),
    writingScore: numeric("writing_score", {
      precision: 3,
      scale: 1,
      mode: "number",
    }),
    speakingScore: numeric("speaking_score", {
      precision: 3,
      scale: 1,
      mode: "number",
    }),
    overallScore: numeric("overall_score", {
      precision: 3,
      scale: 1,
      mode: "number",
    }),
    skillScores: jsonb("skill_scores"),
    startedAt: timestamp("started_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", {
      withTimezone: true,
      mode: "string",
    }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "string" }),
  },
  (table) => ({
    userIdx: index("exam_sessions_user_idx").on(table.userId),
    statusIdx: index("exam_sessions_status_idx").on(table.status),
    userStatusIdx: index("exam_sessions_user_status_idx")
      .on(table.userId, table.status)
      .where(sql`${table.deletedAt} IS NULL`),
  }),
);

export const examAnswers = pgTable(
  "exam_answers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .references(() => examSessions.id, { onDelete: "cascade" })
      .notNull(),
    questionId: uuid("question_id")
      .references(() => questions.id, { onDelete: "cascade" })
      .notNull(),
    answer: jsonb("answer").notNull(),
    isCorrect: boolean("is_correct"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull()
      .$onUpdate(() => new Date().toISOString()),
  },
  (table) => ({
    sessionQuestionUnique: uniqueIndex("exam_answers_session_question_idx").on(
      table.sessionId,
      table.questionId,
    ),
  }),
);

export const examSubmissions = pgTable(
  "exam_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id")
      .references(() => examSessions.id, { onDelete: "cascade" })
      .notNull(),
    submissionId: uuid("submission_id")
      .references(() => submissions.id, { onDelete: "cascade" })
      .notNull(),
    skill: skillEnum("skill").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "string" })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    sessionSubmissionUnique: uniqueIndex(
      "exam_submissions_session_submission_unique",
    ).on(table.sessionId, table.submissionId),
    sessionIdx: index("exam_submissions_session_idx").on(table.sessionId),
    submissionIdx: index("exam_submissions_submission_idx").on(
      table.submissionId,
    ),
  }),
);

export type Exam = typeof exams.$inferSelect;
export type NewExam = typeof exams.$inferInsert;
export type ExamSession = typeof examSessions.$inferSelect;
export type NewExamSession = typeof examSessions.$inferInsert;
export type ExamAnswer = typeof examAnswers.$inferSelect;
export type NewExamAnswer = typeof examAnswers.$inferInsert;
export type ExamSubmission = typeof examSubmissions.$inferSelect;
export type NewExamSubmission = typeof examSubmissions.$inferInsert;
