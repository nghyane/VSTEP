import { QuestionFormat, QuestionLevel, Skill } from "@common/enums";
import { t } from "elysia";

export namespace QuestionModel {
  export const Question = t.Object({
    id: t.String({ format: "uuid" }),
    skill: Skill,
    level: QuestionLevel,
    format: QuestionFormat,
    content: t.Any(),
    version: t.Number(),
    isActive: t.Boolean(),
    createdBy: t.Optional(t.Nullable(t.String({ format: "uuid" }))),
    createdAt: t.String({ format: "date-time" }),
    updatedAt: t.String({ format: "date-time" }),
  });

  export const QuestionWithDetails = t.Object({
    ...Question.properties,
    deletedAt: t.Optional(t.Nullable(t.String({ format: "date-time" }))),
  });

  /** Full question including answerKey — admin/instructor only */
  export const QuestionFull = t.Object({
    ...QuestionWithDetails.properties,
    answerKey: t.Optional(t.Any()),
  });

  export const Version = t.Object({
    id: t.String({ format: "uuid" }),
    questionId: t.String({ format: "uuid" }),
    version: t.Number(),
    content: t.Any(),
    answerKey: t.Optional(t.Any()),
    createdAt: t.String({ format: "date-time" }),
  });

  export const CreateBody = t.Object({
    skill: Skill,
    level: QuestionLevel,
    format: QuestionFormat,
    content: t.Any(),
    answerKey: t.Optional(t.Any()),
  });

  export const UpdateBody = t.Partial(
    t.Object({
      skill: Skill,
      level: QuestionLevel,
      format: QuestionFormat,
      content: t.Any(),
      answerKey: t.Optional(t.Any()),
      isActive: t.Boolean(),
    }),
  );

  export const VersionBody = t.Object({
    content: t.Any(),
    answerKey: t.Optional(t.Any()),
  });

  export type Question = typeof Question.static;
  export type QuestionWithDetails = typeof QuestionWithDetails.static;
  export type Version = typeof Version.static;
  export type CreateBody = typeof CreateBody.static;
  export type UpdateBody = typeof UpdateBody.static;
}
