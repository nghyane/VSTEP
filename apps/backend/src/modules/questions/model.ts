import { QuestionLevel, QuestionSkill } from "@common/enums";
import { t } from "elysia";

export namespace QuestionModel {
  export const Question = t.Object({
    id: t.String({ format: "uuid" }),
    skill: QuestionSkill,
    level: QuestionLevel,
    format: t.String(),
    content: t.Any(),
    answerKey: t.Optional(t.Any()),
    version: t.Number(),
    isActive: t.Boolean(),
    createdBy: t.Optional(t.Nullable(t.String({ format: "uuid" }))),
    createdAt: t.String(),
    updatedAt: t.String(),
  });

  export const QuestionWithDetails = t.Object({
    ...Question.properties,
    deletedAt: t.Optional(t.Nullable(t.String())),
  });

  export const Version = t.Object({
    id: t.String({ format: "uuid" }),
    questionId: t.String({ format: "uuid" }),
    version: t.Number(),
    content: t.Any(),
    answerKey: t.Optional(t.Any()),
    createdAt: t.String(),
  });

  export const CreateBody = t.Object({
    skill: QuestionSkill,
    level: QuestionLevel,
    format: t.String(),
    content: t.Any(),
    answerKey: t.Optional(t.Any()),
  });

  export const UpdateBody = t.Partial(
    t.Object({
      skill: QuestionSkill,
      level: QuestionLevel,
      format: t.String(),
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
