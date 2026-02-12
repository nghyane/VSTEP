import {
  ActiveFilter,
  LevelFilter,
  PaginationQuery,
  SearchFilter,
  SkillFilter,
} from "@common/schemas";
import { QuestionFormat, QuestionLevel, Skill } from "@db/enums";
import { ObjectiveAnswerKey } from "@db/types/answers";
import { QuestionContent } from "@db/types/question-content";
import { questionFullView, questionVersionView, questionView } from "@db/views";
import { t } from "elysia";

export const Question = questionView.schema;
export type Question = typeof Question.static;

export const QuestionFull = questionFullView.schema;
export type QuestionFull = typeof QuestionFull.static;

export const QuestionVersion = questionVersionView.schema;
export type QuestionVersion = typeof QuestionVersion.static;

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

export const QuestionListQuery = t.Composite([
  PaginationQuery,
  SkillFilter,
  LevelFilter,
  ActiveFilter,
  SearchFilter,
  t.Object({
    format: t.Optional(QuestionFormat),
  }),
]);

export type QuestionCreateBody = typeof QuestionCreateBody.static;
export type QuestionUpdateBody = typeof QuestionUpdateBody.static;
export type QuestionListQuery = typeof QuestionListQuery.static;
export type QuestionVersionBody = typeof QuestionVersionBody.static;
