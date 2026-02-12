import { examSessions, exams } from "@db/schema";
import { ExamBlueprint } from "@db/types/grading";
import { getTableColumns } from "drizzle-orm";
import { createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";
import { toQueryColumns } from "./helpers";

const { deletedAt: _, ...examColumns } = getTableColumns(exams);
const { deletedAt: __, ...sessionColumns } = getTableColumns(examSessions);

const ExamRow = createSelectSchema(exams, { blueprint: ExamBlueprint });
const SessionRow = createSelectSchema(examSessions);

export const examView = {
  columns: examColumns,
  queryColumns: toQueryColumns(examColumns),
  schema: t.Omit(ExamRow, ["deletedAt"]),
};

export const sessionView = {
  columns: sessionColumns,
  queryColumns: toQueryColumns(sessionColumns),
  schema: t.Omit(SessionRow, ["deletedAt"]),
};
