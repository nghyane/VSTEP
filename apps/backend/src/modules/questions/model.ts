import { QuestionFormat, QuestionLevel, Skill } from "@common/enums";
import { t } from "elysia";
import { ObjectiveAnswerKey, QuestionContent } from "./content-schemas";

export namespace QuestionModel {
  export const Question = t.Object({
    id: t.String({ format: "uuid" }),
    skill: Skill,
    level: QuestionLevel,
    format: QuestionFormat,
    content: QuestionContent,
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
    answerKey: t.Optional(t.Nullable(ObjectiveAnswerKey)),
  });

  export const Version = t.Object({
    id: t.String({ format: "uuid" }),
    questionId: t.String({ format: "uuid" }),
    version: t.Number(),
    content: QuestionContent,
    answerKey: t.Optional(t.Nullable(ObjectiveAnswerKey)),
    createdAt: t.String({ format: "date-time" }),
  });

  export const CreateBody = t.Object({
    skill: Skill,
    level: QuestionLevel,
    format: QuestionFormat,
    content: QuestionContent,
    answerKey: t.Optional(ObjectiveAnswerKey),
  });

  export const UpdateBody = t.Partial(
    t.Object({
      skill: Skill,
      level: QuestionLevel,
      format: QuestionFormat,
      content: QuestionContent,
      answerKey: t.Optional(ObjectiveAnswerKey),
      isActive: t.Boolean(),
    }),
  );

  export const VersionBody = t.Object({
    content: QuestionContent,
    answerKey: t.Optional(ObjectiveAnswerKey),
  });

  export type Question = typeof Question.static;
  export type QuestionWithDetails = typeof QuestionWithDetails.static;
  export type Version = typeof Version.static;
  export type CreateBody = typeof CreateBody.static;
  export type UpdateBody = typeof UpdateBody.static;
}
