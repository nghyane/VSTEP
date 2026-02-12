import { ActiveFilter, LevelFilter, PaginationQuery } from "@common/schemas";
import { QuestionLevel } from "@db/enums";
import { SubmissionAnswer } from "@db/types/answers";
import { ExamBlueprint } from "@db/types/grading";
import { examView, sessionView } from "@db/views";
import { t } from "elysia";

export const Exam = examView.schema;
export type Exam = typeof Exam.static;

export const ExamSession = sessionView.schema;
export type ExamSession = typeof ExamSession.static;

export const SessionParams = t.Object({
  sessionId: t.String({ format: "uuid" }),
});

export const ExamCreateBody = t.Object({
  level: QuestionLevel,
  blueprint: ExamBlueprint,
  isActive: t.Optional(t.Boolean({ default: true })),
});

export const ExamUpdateBody = t.Partial(
  t.Object({
    level: QuestionLevel,
    blueprint: ExamBlueprint,
    isActive: t.Boolean(),
  }),
);

export const ExamAnswerItem = t.Object({
  questionId: t.String({ format: "uuid" }),
  answer: SubmissionAnswer,
});

export const ExamAnswerSaveBody = t.Object({
  answers: t.Array(ExamAnswerItem, { minItems: 1, maxItems: 200 }),
});

export const ExamListQuery = t.Composite([
  PaginationQuery,
  LevelFilter,
  ActiveFilter,
]);

export type ExamCreateBody = typeof ExamCreateBody.static;
export type ExamUpdateBody = typeof ExamUpdateBody.static;
export type ExamAnswerSaveBody = typeof ExamAnswerSaveBody.static;
export type ExamListQuery = typeof ExamListQuery.static;
