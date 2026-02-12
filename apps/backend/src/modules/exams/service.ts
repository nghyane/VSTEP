import { BadRequestError } from "@common/errors";
import { assertExists, now } from "@common/utils";
import type { DbTransaction } from "@db/index";
import { db, notDeleted, table } from "@db/index";
import { paginatedQuery } from "@db/repos";
import { examView } from "@db/views";
import { and, count, desc, eq, inArray } from "drizzle-orm";
import { EXAM_MESSAGES } from "./messages";
import type { ExamCreateBody, ExamListQuery, ExamUpdateBody } from "./schema";

export type ExamSessionStatus =
  (typeof table.examSessions.$inferSelect)["status"];

async function validateBlueprintQuestions(
  tx: DbTransaction,
  blueprint: ExamCreateBody["blueprint"],
) {
  const questionIds = [
    ...(blueprint.listening?.questionIds ?? []),
    ...(blueprint.reading?.questionIds ?? []),
    ...(blueprint.writing?.questionIds ?? []),
    ...(blueprint.speaking?.questionIds ?? []),
  ];

  if (questionIds.length === 0) return;

  const uniqueQuestionIds = [...new Set(questionIds)];

  const foundQuestions = await tx
    .select({ id: table.questions.id })
    .from(table.questions)
    .where(
      and(
        inArray(table.questions.id, uniqueQuestionIds),
        notDeleted(table.questions),
        eq(table.questions.isActive, true),
      ),
    );

  if (foundQuestions.length === uniqueQuestionIds.length) return;

  const foundIds = new Set(foundQuestions.map((question) => question.id));
  const missingIds = uniqueQuestionIds.filter((id) => !foundIds.has(id));

  throw new BadRequestError(
    EXAM_MESSAGES.blueprintMissingQuestions(missingIds),
  );
}

/** Public resource — any authenticated user can view an exam. No ownership check needed. */
export async function getExamById(id: string) {
  const exam = await db.query.exams.findFirst({
    where: and(eq(table.exams.id, id), notDeleted(table.exams)),
    columns: examView.queryColumns,
  });

  return assertExists(exam, "Exam");
}

export async function listExams(query: ExamListQuery) {
  const conditions = [notDeleted(table.exams)];
  if (query.level) conditions.push(eq(table.exams.level, query.level));
  if (query.isActive !== undefined)
    conditions.push(eq(table.exams.isActive, query.isActive));

  const whereClause = and(...conditions);

  const pg = paginatedQuery(query.page, query.limit);
  return pg.resolve({
    count: db
      .select({ count: count() })
      .from(table.exams)
      .where(whereClause)
      .then((result) => result[0]?.count ?? 0),
    query: db
      .select(examView.columns)
      .from(table.exams)
      .where(whereClause)
      .orderBy(desc(table.exams.createdAt))
      .limit(pg.limit)
      .offset(pg.offset),
  });
}

export async function createExam(userId: string, body: ExamCreateBody) {
  return db.transaction(async (tx) => {
    await validateBlueprintQuestions(tx, body.blueprint);

    const [exam] = await tx
      .insert(table.exams)
      .values({
        level: body.level,
        blueprint: body.blueprint,
        isActive: body.isActive ?? true,
        createdBy: userId,
      })
      .returning(examView.columns);

    return assertExists(exam, "Exam");
  });
}

export async function updateExam(id: string, body: ExamUpdateBody) {
  return db.transaction(async (tx) => {
    const updateValues: Partial<typeof table.exams.$inferInsert> = {
      updatedAt: now(),
    };

    if (body.level !== undefined) updateValues.level = body.level;
    if (body.blueprint !== undefined) {
      await validateBlueprintQuestions(tx, body.blueprint);
      updateValues.blueprint = body.blueprint;
    }
    if (body.isActive !== undefined) updateValues.isActive = body.isActive;

    const [exam] = await tx
      .update(table.exams)
      .set(updateValues)
      .where(and(eq(table.exams.id, id), notDeleted(table.exams)))
      .returning(examView.columns);

    return assertExists(exam, "Exam");
  });
}
