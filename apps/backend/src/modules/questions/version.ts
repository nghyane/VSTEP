import type { Actor } from "@common/auth-types";
import { assertAccess, assertExists } from "@common/utils";
import { db, table } from "@db/index";
import { and, desc, eq } from "drizzle-orm";
import type { QuestionVersionBody } from "./schema";

export async function createQuestionVersion(
  questionId: string,
  body: QuestionVersionBody,
  actor: Actor,
) {
  return db.transaction(async (tx) => {
    const question = assertExists(
      await tx.query.questions.findFirst({
        where: eq(table.questions.id, questionId),
        columns: {
          id: true,
          version: true,
          createdBy: true,
        },
      }),
      "Question",
    );

    assertAccess(
      question.createdBy,
      actor,
      "You can only create versions of your own questions",
    );

    const newVersion = question.version + 1;

    const [version] = await tx
      .insert(table.questionVersions)
      .values({
        questionId,
        version: newVersion,
        content: body.content,
        answerKey: body.answerKey ?? null,
      })
      .returning();

    const v = assertExists(version, "Version");

    await tx
      .update(table.questions)
      .set({
        content: body.content,
        answerKey: body.answerKey ?? null,
        version: newVersion,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(table.questions.id, questionId));

    return v;
  });
}

export async function getQuestionVersions(questionId: string) {
  assertExists(
    await db.query.questions.findFirst({
      where: eq(table.questions.id, questionId),
      columns: { id: true },
    }),
    "Question",
  );

  const versions = await db
    .select()
    .from(table.questionVersions)
    .where(eq(table.questionVersions.questionId, questionId))
    .orderBy(desc(table.questionVersions.version));

  return {
    data: versions,
    meta: { total: versions.length },
  };
}

export async function getQuestionVersion(
  questionId: string,
  versionId: string,
) {
  assertExists(
    await db.query.questions.findFirst({
      where: eq(table.questions.id, questionId),
      columns: { id: true },
    }),
    "Question",
  );

  const version = await db.query.questionVersions.findFirst({
    where: and(
      eq(table.questionVersions.id, versionId),
      eq(table.questionVersions.questionId, questionId),
    ),
  });

  return assertExists(version, "QuestionVersion");
}
