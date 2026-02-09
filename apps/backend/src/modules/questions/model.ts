import { QuestionFormat, QuestionLevel, Skill } from "@common/enums";
import { t } from "elysia";
import { ObjectiveAnswerKey, QuestionContent } from "./content-schemas";

export const QuestionCreateBody = t.Object({
  skill: Skill,
  level: QuestionLevel,
  format: QuestionFormat,
  content: QuestionContent,
  answerKey: t.Optional(ObjectiveAnswerKey),
});

export const QuestionUpdateBody = t.Partial(
  t.Object({
    skill: Skill,
    level: QuestionLevel,
    format: QuestionFormat,
    content: QuestionContent,
    answerKey: t.Optional(ObjectiveAnswerKey),
    isActive: t.Boolean(),
  }),
);

export const QuestionVersionBody = t.Object({
  content: QuestionContent,
  answerKey: t.Optional(ObjectiveAnswerKey),
});

export const QuestionListQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  skill: t.Optional(Skill),
  level: t.Optional(QuestionLevel),
  format: t.Optional(QuestionFormat),
  isActive: t.Optional(t.Boolean()),
  search: t.Optional(t.String()),
});

export type QuestionCreateBody = typeof QuestionCreateBody.static;
export type QuestionUpdateBody = typeof QuestionUpdateBody.static;
export type QuestionListQuery = typeof QuestionListQuery.static;
export type QuestionVersionBody = typeof QuestionVersionBody.static;
