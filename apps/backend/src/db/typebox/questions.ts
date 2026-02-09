import { ObjectiveAnswerKey } from "@common/answer-schemas";
import { QuestionContent } from "@common/question-content";
import { questions, questionVersions } from "@db/schema";
import { t } from "elysia";
import { createSelectSchema } from "./factory";

const QuestionRow = createSelectSchema(questions, {
  content: QuestionContent,
  answerKey: t.Nullable(ObjectiveAnswerKey),
});

export const QuestionSchema = t.Omit(QuestionRow, ["answerKey", "deletedAt"]);
export type QuestionSchema = typeof QuestionSchema.static;

export const QuestionWithDetailsSchema = t.Omit(QuestionRow, ["answerKey"]);
export type QuestionWithDetailsSchema = typeof QuestionWithDetailsSchema.static;

const QuestionVersionRow = createSelectSchema(questionVersions, {
  content: QuestionContent,
  answerKey: t.Nullable(ObjectiveAnswerKey),
});

export const QuestionVersionSchema = QuestionVersionRow;
export type QuestionVersionSchema = typeof QuestionVersionSchema.static;
