import { QuestionLevel } from "@common/enums";
import { t } from "elysia";
import {
  ExamBlueprint,
  SubmissionAnswer,
} from "@/modules/questions/content-schemas";

export const ExamSessionIdParam = t.Object({
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

export const ExamAnswerSaveBody = t.Object({
  answers: t.Array(
    t.Object({
      questionId: t.String({ format: "uuid" }),
      answer: SubmissionAnswer,
    }),
    { maxItems: 200 },
  ),
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
