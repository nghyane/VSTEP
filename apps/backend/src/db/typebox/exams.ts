import { examSessions, exams } from "@db/schema";
import { t } from "elysia";
import { ExamBlueprint } from "@/modules/questions/content-schemas";
import { createSelectSchema } from "./factory";

const ExamRow = createSelectSchema(exams, {
  blueprint: ExamBlueprint,
});

export const ExamSchema = t.Omit(ExamRow, ["deletedAt"]);
export type ExamSchema = typeof ExamSchema.static;

const ExamSessionRow = createSelectSchema(examSessions);

export const ExamSessionSchema = t.Omit(ExamSessionRow, ["deletedAt"]);
export type ExamSessionSchema = typeof ExamSessionSchema.static;
