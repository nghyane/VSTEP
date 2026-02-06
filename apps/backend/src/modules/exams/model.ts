import { ExamStatus, QuestionLevel } from "@common/enums";
import { t } from "elysia";

export namespace ExamModel {
  export const Exam = t.Object({
    id: t.String({ format: "uuid" }),
    level: QuestionLevel,
    blueprint: t.Any(),
    isActive: t.Boolean(),
    createdBy: t.Nullable(t.String({ format: "uuid" })),
    createdAt: t.String({ format: "date-time" }),
    updatedAt: t.String({ format: "date-time" }),
  });

  export const Session = t.Object({
    id: t.String({ format: "uuid" }),
    userId: t.String({ format: "uuid" }),
    examId: t.String({ format: "uuid" }),
    status: ExamStatus,
    listeningScore: t.Nullable(t.Number()),
    readingScore: t.Nullable(t.Number()),
    writingScore: t.Nullable(t.Number()),
    speakingScore: t.Nullable(t.Number()),
    overallScore: t.Nullable(t.Number()),
    skillScores: t.Nullable(t.Any()),
    startedAt: t.String({ format: "date-time" }),
    completedAt: t.Nullable(t.String({ format: "date-time" })),
    createdAt: t.String({ format: "date-time" }),
    updatedAt: t.String({ format: "date-time" }),
  });

  export const SessionIdParam = t.Object({
    sessionId: t.String({ format: "uuid" }),
  });

  export const CreateBody = t.Object({
    level: QuestionLevel,
    blueprint: t.Any(),
    isActive: t.Optional(t.Boolean({ default: true })),
  });

  export const UpdateBody = t.Partial(
    t.Object({
      level: QuestionLevel,
      blueprint: t.Any(),
      isActive: t.Boolean(),
    }),
  );

  export const AnswerSaveBody = t.Object({
    answers: t.Array(
      t.Object({
        questionId: t.String({ format: "uuid" }),
        answer: t.Any(),
      }),
    ),
  });

  export type Exam = typeof Exam.static;
  export type Session = typeof Session.static;
  export type CreateBody = typeof CreateBody.static;
  export type UpdateBody = typeof UpdateBody.static;
  export type AnswerSaveBody = typeof AnswerSaveBody.static;
}
