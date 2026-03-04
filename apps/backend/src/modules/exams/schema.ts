import { QuestionLevel, Skill } from "@db/enums";
import { examSessions, exams } from "@db/schema";
import { SubmissionAnswer } from "@db/types/answers";
import { ExamBlueprint } from "@db/types/exam-blueprint";
import { QuestionContent } from "@db/types/question-content";
import { getTableColumns } from "drizzle-orm";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-typebox";
import { t } from "elysia";

const examColumns = getTableColumns(exams);
const sessionColumns = getTableColumns(examSessions);
export const EXAM_COLUMNS = examColumns;
export const SESSION_COLUMNS = sessionColumns;

const ExamRow = createSelectSchema(exams, { blueprint: ExamBlueprint });
const SessionRow = createSelectSchema(examSessions);

export const Exam = ExamRow;
export type Exam = typeof Exam.static;

export const ExamSession = SessionRow;
export type ExamSession = typeof ExamSession.static;

const InsertExam = createInsertSchema(exams, {
  level: QuestionLevel,
  blueprint: ExamBlueprint,
});
export const ExamCreateBody = t.Pick(InsertExam, [
  "title",
  "level",
  "blueprint",
  "isActive",
  "description",
]);

const UpdateExam = createUpdateSchema(exams, {
  level: () => QuestionLevel,
  blueprint: () => ExamBlueprint,
  isActive: () => t.Boolean(),
});
export const ExamUpdateBody = t.Pick(UpdateExam, [
  "title",
  "level",
  "blueprint",
  "isActive",
  "description",
]);

export const SessionListQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  status: t.Optional(
    t.UnionEnum(["in_progress", "submitted", "completed", "abandoned"], {
      default: undefined,
    }),
  ),
});

const SessionQuestion = t.Object({
  id: t.String({ format: "uuid" }),
  skill: Skill,
  part: t.Integer(),
  content: QuestionContent,
});

const SessionAnswer = t.Object({
  questionId: t.String({ format: "uuid" }),
  answer: SubmissionAnswer,
});

export const ExamSessionDetail = t.Object({
  ...SessionRow.properties,
  questions: t.Array(SessionQuestion),
  answers: t.Array(SessionAnswer),
});

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
export type SessionListQuery = typeof SessionListQuery.static;
