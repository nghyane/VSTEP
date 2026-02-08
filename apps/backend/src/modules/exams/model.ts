import { ExamStatus, QuestionLevel } from "@common/enums";
import { t } from "elysia";
import {
  ExamBlueprint,
  SubmissionAnswer,
} from "@/modules/questions/content-schemas";

/** Per-skill score breakdown stored in session.skillScores JSONB */
const SkillScores = t.Object({
  listening: t.Optional(t.Nullable(t.Number({ minimum: 0, maximum: 10 }))),
  reading: t.Optional(t.Nullable(t.Number({ minimum: 0, maximum: 10 }))),
  writing: t.Optional(t.Nullable(t.Number({ minimum: 0, maximum: 10 }))),
  speaking: t.Optional(t.Nullable(t.Number({ minimum: 0, maximum: 10 }))),
});

export const ExamSchema = t.Object({
  id: t.String({ format: "uuid" }),
  level: QuestionLevel,
  blueprint: ExamBlueprint,
  isActive: t.Boolean(),
  createdBy: t.Nullable(t.String({ format: "uuid" })),
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
});

export const ExamSessionSchema = t.Object({
  id: t.String({ format: "uuid" }),
  userId: t.String({ format: "uuid" }),
  examId: t.String({ format: "uuid" }),
  status: ExamStatus,
  listeningScore: t.Nullable(t.Number()),
  readingScore: t.Nullable(t.Number()),
  writingScore: t.Nullable(t.Number()),
  speakingScore: t.Nullable(t.Number()),
  overallScore: t.Nullable(t.Number()),
  skillScores: t.Nullable(SkillScores),
  startedAt: t.String({ format: "date-time" }),
  completedAt: t.Nullable(t.String({ format: "date-time" })),
  createdAt: t.String({ format: "date-time" }),
  updatedAt: t.String({ format: "date-time" }),
});

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

export type ExamSchema = typeof ExamSchema.static;
export type ExamSessionSchema = typeof ExamSessionSchema.static;
export type ExamCreateBody = typeof ExamCreateBody.static;
export type ExamUpdateBody = typeof ExamUpdateBody.static;
export type ExamAnswerSaveBody = typeof ExamAnswerSaveBody.static;
