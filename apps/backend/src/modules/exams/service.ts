import { assertExists, now } from "@common/utils";
import type { DbTransaction } from "@db/index";
import { db, notDeleted, omitColumns, paginatedList, table } from "@db/index";
import { and, count, desc, eq, getTableColumns, inArray } from "drizzle-orm";
import { BadRequestError } from "@/plugins/error";
import type { ExamCreateBody, ExamListQuery, ExamUpdateBody } from "./model";

export const EXAM_COLUMNS = omitColumns(getTableColumns(table.exams), [
  "deletedAt",
]);
export const SESSION_COLUMNS = omitColumns(
  getTableColumns(table.examSessions),
  ["deletedAt"],
);
export type ExamSessionStatus =
  (typeof table.examSessions.$inferSelect)["status"];

/** Derive a { key: true } columns object from SESSION_COLUMNS keys for relational queries */
export const SESSION_QUERY_COLUMNS = Object.fromEntries(
  Object.keys(SESSION_COLUMNS).map((k) => [k, true] as const),
) as { [K in keyof typeof SESSION_COLUMNS]: true };

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
    `Blueprint references non-existent or inactive questions: [${missingIds.join(", ")}]`,
  );
}

/** Public resource — any authenticated user can view an exam. No ownership check needed. */
export async function getExamById(id: string) {
  const exam = await db.query.exams.findFirst({
    where: and(eq(table.exams.id, id), notDeleted(table.exams)),
    columns: {
      id: true,
      level: true,
      blueprint: true,
      isActive: true,
      createdBy: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return assertExists(exam, "Exam");
}

export async function listExams(query: ExamListQuery) {
  const conditions = [notDeleted(table.exams)];
  if (query.level) conditions.push(eq(table.exams.level, query.level));
  if (query.isActive !== undefined)
    conditions.push(eq(table.exams.isActive, query.isActive));

  const whereClause = and(...conditions);

  return paginatedList({
    page: query.page,
    limit: query.limit,
    getCount: async () => {
      const [result] = await db
        .select({ count: count() })
        .from(table.exams)
        .where(whereClause);
      return result?.count ?? 0;
    },
    getData: ({ limit, offset }) =>
      db
        .select(EXAM_COLUMNS)
        .from(table.exams)
        .where(whereClause)
        .orderBy(desc(table.exams.createdAt))
        .limit(limit)
        .offset(offset),
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
      .returning(EXAM_COLUMNS);

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
      .returning(EXAM_COLUMNS);

    return assertExists(exam, "Exam");
  });
}
