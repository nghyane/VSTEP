import { QuestionFormat, QuestionLevel, Skill } from "@db/enums";
import { questions, questionVersions } from "@db/schema";
import { skillEnum } from "@db/schema/enums";
import { questionFormatEnum, questionLevelEnum } from "@db/schema/questions";
import { ObjectiveAnswerKey } from "@db/types/answers";
import { QuestionContent } from "@db/types/question-content";
import { getTableColumns } from "drizzle-orm";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-typebox";
import { t } from "elysia";

const JSONB_REFINE = {
  content: QuestionContent,
  answerKey: t.Nullable(ObjectiveAnswerKey),
};

const { answerKey: _, deletedAt: __, ...columns } = getTableColumns(questions);
export const QUESTION_COLUMNS = columns;

const SelectQuestion = createSelectSchema(questions, JSONB_REFINE);

export const Question = t.Omit(SelectQuestion, ["answerKey", "deletedAt"]);
export type Question = typeof Question.static;

export const QuestionVersion = createSelectSchema(
  questionVersions,
  JSONB_REFINE,
);
export type QuestionVersion = typeof QuestionVersion.static;

const InsertQuestion = createInsertSchema(questions, {
  skill: Skill,
  level: QuestionLevel,
  format: QuestionFormat,
  content: QuestionContent,
  answerKey: t.Optional(ObjectiveAnswerKey),
});

export const QuestionCreateBody = t.Pick(InsertQuestion, [
  "skill",
  "level",
  "format",
  "content",
  "answerKey",
]);

const UpdateQuestion = createUpdateSchema(questions, {
  skill: () => Skill,
  level: () => QuestionLevel,
  format: () => QuestionFormat,
  content: () => QuestionContent,
  answerKey: () => ObjectiveAnswerKey,
  isActive: () => t.Boolean(),
});

export const QuestionUpdateBody = t.Pick(UpdateQuestion, [
  "skill",
  "level",
  "format",
  "content",
  "answerKey",
  "isActive",
]);

export const QuestionVersionBody = t.Object({
  content: QuestionContent,
  answerKey: t.Optional(ObjectiveAnswerKey),
});

export const QuestionListQuery = t.Object({
  page: t.Optional(t.Number({ minimum: 1, default: 1 })),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100, default: 20 })),
  skill: t.Optional(t.UnionEnum(skillEnum.enumValues, { default: undefined })),
  level: t.Optional(
    t.UnionEnum(questionLevelEnum.enumValues, { default: undefined }),
  ),
  format: t.Optional(
    t.UnionEnum(questionFormatEnum.enumValues, { default: undefined }),
  ),
  isActive: t.Optional(t.Boolean()),
  search: t.Optional(t.String({ maxLength: 255 })),
});

export type QuestionCreateBody = typeof QuestionCreateBody.static;
export type QuestionUpdateBody = typeof QuestionUpdateBody.static;
export type QuestionListQuery = typeof QuestionListQuery.static;
export type QuestionVersionBody = typeof QuestionVersionBody.static;
