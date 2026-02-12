import { submissions } from "@db/schema";
import { getTableColumns } from "drizzle-orm";
import { createSelectSchema } from "drizzle-typebox";
import { t } from "elysia";
import { omitColumns, toQueryColumns } from "./helpers";

const OMITTED_SUBMISSION_COLUMNS = [
  "confidence",
  "isLate",
  "attempt",
  "requestId",
  "reviewPriority",
  "reviewerId",
  "gradingMode",
  "auditFlag",
  "claimedBy",
  "claimedAt",
  "deadline",
  "deletedAt",
] as const;

const columns = omitColumns(getTableColumns(submissions), [
  ...OMITTED_SUBMISSION_COLUMNS,
]);
const SubmissionRow = createSelectSchema(submissions);

export const submissionView = {
  columns,
  queryColumns: toQueryColumns(columns),
  schema: t.Omit(SubmissionRow, [...OMITTED_SUBMISSION_COLUMNS]),
};
