import { questions, questionVersions } from "@db/schema";
import { ObjectiveAnswerKey } from "@db/types/answers";
import { QuestionContent } from "@db/types/question-content";
import { getTableColumns } from "drizzle-orm";
import { createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";
import { toQueryColumns } from "./helpers";

const JSONB_REFINE = {
  content: QuestionContent,
  answerKey: t.Nullable(ObjectiveAnswerKey),
};

const {
  answerKey: _,
  deletedAt: __,
  ...questionColumns
} = getTableColumns(questions);
const { deletedAt: ___, ...questionFullColumns } = getTableColumns(questions);
const questionVersionColumns = getTableColumns(questionVersions);

const QuestionRow = createSelectSchema(questions, JSONB_REFINE);
const QuestionVersionRow = createSelectSchema(questionVersions, JSONB_REFINE);

export const questionView = {
  columns: questionColumns,
  queryColumns: toQueryColumns(questionColumns),
  schema: t.Omit(QuestionRow, ["answerKey", "deletedAt"]),
};

export const questionFullView = {
  columns: questionFullColumns,
  queryColumns: toQueryColumns(questionFullColumns),
  schema: t.Omit(QuestionRow, ["deletedAt"]),
};

export const questionVersionView = {
  columns: questionVersionColumns,
  queryColumns: toQueryColumns(questionVersionColumns),
  schema: QuestionVersionRow,
};
