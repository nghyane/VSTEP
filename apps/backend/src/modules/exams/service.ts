import { BadRequestError } from "@common/errors";
import { createStateMachine } from "@common/state-machine";
import { assertExists } from "@common/utils";
import type { DbTransaction } from "@db/index";
import { db, notDeleted, paginated, table } from "@db/index";
import type { ExamSession } from "@db/schema/exams";
import { and, count, desc, eq, inArray, type SQL } from "drizzle-orm";
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
      and(
        inArray(table.questions.id, ids),
        notDeleted(table.questions),
        eq(table.questions.isActive, true),
      ),
    );

  if (found.length === ids.length) return;

  const have = new Set(found.map((q) => q.id));
  throw new BadRequestError(
    `Blueprint references non-existent or inactive questions: [${ids.filter((id) => !have.has(id)).join(", ")}]`,
  );
}

export async function getExamById(id: string) {
  const exam = await db.query.exams.findFirst({
    where: and(eq(table.exams.id, id), notDeleted(table.exams)),
    columns: { deletedAt: false },
  });

  return assertExists(exam, "Exam");
}

export async function listExams(query: ExamListQuery) {
  const where = and(
    ...[
      notDeleted(table.exams),
      query.level && eq(table.exams.level, query.level),
      query.isActive !== undefined && eq(table.exams.isActive, query.isActive),
    ].filter((c): c is SQL => Boolean(c)),
  );

  const pg = paginated(query.page, query.limit);
  return pg.resolve({
    count: db
      .select({ count: count() })
      .from(table.exams)
      .where(where)
      .then((r) => r[0]?.count ?? 0),
    query: db
      .select(EXAM_COLUMNS)
      .from(table.exams)
      .where(where)
      .orderBy(desc(table.exams.createdAt))
      .limit(pg.limit)
      .offset(pg.offset),
  });
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
      .where(and(eq(table.exams.id, id), notDeleted(table.exams)))
      .returning(EXAM_COLUMNS);

    return assertExists(exam, "Exam");
  });
}
