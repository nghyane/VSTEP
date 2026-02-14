import { BadRequestError } from "@common/errors";
import { createStateMachine } from "@common/state-machine";
import { assertExists } from "@common/utils";
import type { DbTransaction } from "@db/index";
import { db, paginate, table } from "@db/index";
import type { ExamSession } from "@db/schema/exams";
import { and, desc, eq, inArray } from "drizzle-orm";
import type { ExamCreateBody, ExamListQuery, ExamUpdateBody } from "./schema";
import { EXAM_COLUMNS } from "./schema";

export type ExamSessionStatus = ExamSession["status"];

export const examSessionMachine = createStateMachine<ExamSessionStatus>({
  // biome-ignore lint/style/useNamingConvention: must match DB enum value
  in_progress: ["submitted", "completed", "abandoned"],
  submitted: ["completed"],
  completed: [],
  abandoned: [],
});

async function validateBlueprint(
  tx: DbTransaction,
  blueprint: ExamCreateBody["blueprint"],
) {
  const ids = [
    ...new Set(
      (["listening", "reading", "writing", "speaking"] as const).flatMap(
        (k) => blueprint[k]?.questionIds ?? [],
      ),
    ),
  ];
  if (ids.length === 0) return;

  const found = await tx
    .select({ id: table.questions.id })
    .from(table.questions)
    .where(
      and(inArray(table.questions.id, ids), eq(table.questions.isActive, true)),
    );

  if (found.length === ids.length) return;

  const have = new Set(found.map((q) => q.id));
  throw new BadRequestError(
    `Blueprint references non-existent or inactive questions: [${ids.filter((id) => !have.has(id)).join(", ")}]`,
  );
}

export async function getExamById(id: string) {
  const exam = await db.query.exams.findFirst({
    where: eq(table.exams.id, id),
  });

  return assertExists(exam, "Exam");
}

export async function listExams(query: ExamListQuery) {
  const where = and(
    query.level ? eq(table.exams.level, query.level) : undefined,
    query.isActive !== undefined
      ? eq(table.exams.isActive, query.isActive)
      : undefined,
  );

  return paginate(
    db
      .select(EXAM_COLUMNS)
      .from(table.exams)
      .where(where)
      .orderBy(desc(table.exams.createdAt))
      .$dynamic(),
    db.$count(table.exams, where),
    query,
  );
}

export async function createExam(userId: string, body: ExamCreateBody) {
  return db.transaction(async (tx) => {
    await validateBlueprint(tx, body.blueprint);

    const [exam] = await tx
      .insert(table.exams)
      .values({
        level: body.level,
        blueprint: body.blueprint,
        isActive: body.isActive ?? true,
        createdBy: userId,
      })
      .returning(EXAM_COLUMNS);

    return assertExists(exam, "Exam");
  });
}

export async function updateExam(id: string, body: ExamUpdateBody) {
  return db.transaction(async (tx) => {
    if (body.blueprint !== undefined) {
      await validateBlueprint(tx, body.blueprint);
    }

    const [exam] = await tx
      .update(table.exams)
      .set({
        updatedAt: new Date().toISOString(),
        ...(body.level !== undefined && { level: body.level }),
        ...(body.blueprint !== undefined && { blueprint: body.blueprint }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      })
      .where(eq(table.exams.id, id))
      .returning(EXAM_COLUMNS);

    return assertExists(exam, "Exam");
  });
}
