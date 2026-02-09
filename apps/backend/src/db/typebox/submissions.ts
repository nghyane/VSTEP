import { submissions } from "@db/schema";
import { t } from "elysia";
import { createSelectSchema } from "./factory";

const SubmissionRow = createSelectSchema(submissions);

export const SubmissionSchema = t.Omit(SubmissionRow, [
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
]);
export type SubmissionSchema = typeof SubmissionSchema.static;
