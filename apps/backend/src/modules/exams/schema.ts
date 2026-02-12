import { QuestionLevel } from "@db/enums";
import { examSessions, exams } from "@db/schema";
import { SubmissionAnswer } from "@db/types/answers";
import { ExamBlueprint } from "@db/types/grading";
import { getTableColumns } from "drizzle-orm";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-typebox";
import { t } from "elysia";

/** Drizzle select columns (no deletedAt) for .select()/.returning() */
const { deletedAt: _, ...examColumns } = getTableColumns(exams);
const { deletedAt: __, ...sessionColumns } = getTableColumns(examSessions);
export const EXAM_COLUMNS = examColumns;
export const SESSION_COLUMNS = sessionColumns;

// ── Response schemas — derived from Drizzle table ────────────────────

const ExamRow = createSelectSchema(exams, { blueprint: ExamBlueprint });
const SessionRow = createSelectSchema(examSessions);

export const Exam = t.Omit(ExamRow, ["deletedAt"]);
export type Exam = typeof Exam.static;

export const ExamSession = t.Omit(SessionRow, ["deletedAt"]);
export type ExamSession = typeof ExamSession.static;

// ── Request schemas — derived from createInsertSchema/createUpdateSchema ─

const InsertExam = createInsertSchema(exams, {
  level: QuestionLevel,
  blueprint: ExamBlueprint,
});
export const ExamCreateBody = t.Pick(InsertExam, [
  "level",
  "blueprint",
  "isActive",
]);

const UpdateExam = createUpdateSchema(exams, {
  level: () => QuestionLevel,
  blueprint: () => ExamBlueprint,
  isActive: () => t.Boolean(),
});
export const ExamUpdateBody = t.Pick(UpdateExam, [
  "level",
  "blueprint",
  "isActive",
]);

export const SessionParams = t.Object({
  sessionId: t.String({ format: "uuid" }),
});

export const ExamAnswerItem = t.Object({
  questionId: t.String({ format: "uuid" }),
  answer: SubmissionAnswer,
});

export const ExamAnswerSaveBody = t.Object({
  answers: t.Array(ExamAnswerItem, { minItems: 1, maxItems: 200 }),
});

export const ExamListQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  level: t.Optional(QuestionLevel),
  isActive: t.Optional(t.Boolean()),
});

export type ExamCreateBody = typeof ExamCreateBody.static;
export type ExamUpdateBody = typeof ExamUpdateBody.static;
export type ExamAnswerSaveBody = typeof ExamAnswerSaveBody.static;
export type ExamListQuery = typeof ExamListQuery.static;
