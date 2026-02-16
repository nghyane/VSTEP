import type { Actor } from "@common/auth-types";
import { ROLES } from "@common/auth-types";
import { BadRequestError, ConflictError } from "@common/errors";
import { createStateMachine } from "@common/state-machine";
import { assertExists } from "@common/utils";
import type { DbTransaction } from "@db/index";
import { db, paginate, table, takeFirstOrThrow } from "@db/index";
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
  if (ids.length === 0)
    throw new BadRequestError("Exam must contain at least one question");

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

export async function find(id: string, actor: Actor) {
  const exam = await db.query.exams.findFirst({
    where: and(
      eq(table.exams.id, id),
      actor.is(ROLES.ADMIN) ? undefined : eq(table.exams.isActive, true),
    ),
  });

  return assertExists(exam, "Exam");
}

export async function list(query: ExamListQuery, actor: Actor) {
  const where = and(
    query.level ? eq(table.exams.level, query.level) : undefined,
    query.isActive !== undefined
      ? eq(table.exams.isActive, query.isActive)
      : undefined,
    actor.is(ROLES.ADMIN) ? undefined : eq(table.exams.isActive, true),
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

export async function create(userId: string, body: ExamCreateBody) {
  return db.transaction(async (tx) => {
    await validateBlueprint(tx, body.blueprint);

    return tx
      .insert(table.exams)
      .values({
        level: body.level,
        blueprint: body.blueprint,
        isActive: body.isActive ?? true,
        createdBy: userId,
      })
      .returning(EXAM_COLUMNS)
      .then(takeFirstOrThrow);
  });
}

export async function update(id: string, body: ExamUpdateBody) {
  return db.transaction(async (tx) => {
    const existing = assertExists(
      await tx.query.exams.findFirst({
        where: eq(table.exams.id, id),
      }),
      "Exam",
    );

    const hasNonToggleFields =
      body.level !== undefined || body.blueprint !== undefined;
    if (existing.isActive && hasNonToggleFields) {
      throw new ConflictError("Deactivate the exam before modifying it");
    }

    if (body.blueprint !== undefined) {
      await validateBlueprint(tx, body.blueprint);
    }

    return tx
      .update(table.exams)
      .set({
        updatedAt: new Date().toISOString(),
        ...(body.level !== undefined && { level: body.level }),
        ...(body.blueprint !== undefined && { blueprint: body.blueprint }),
        ...(body.isActive !== undefined && { isActive: body.isActive }),
      })
      .where(eq(table.exams.id, id))
      .returning(EXAM_COLUMNS)
      .then(takeFirstOrThrow);
  });
}
