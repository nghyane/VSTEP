import type { Actor } from "@common/auth-types";
import { BadRequestError } from "@common/errors";
import { calculateScore } from "@common/scoring";
import { assertExists } from "@common/utils";
import { db, table, takeFirstOrThrow } from "@db/index";
import { and, eq, inArray } from "drizzle-orm";
import { record, sync } from "@/modules/progress/service";
import { dispatchGrading } from "@/modules/submissions/grading-dispatch";
import { gradeAnswers, persistCorrectness } from "./grading";
import { SESSION_COLUMNS } from "./schema";
import type { ExamSessionStatus } from "./service";
import { getActiveSession } from "./session";

export async function submit(sessionId: string, actor: Actor) {
  return db.transaction(async (tx) => {
    const session = await getActiveSession(tx, sessionId, actor);

    const answers = await tx
      .select({
        questionId: table.examAnswers.questionId,
        answer: table.examAnswers.answer,
      })
      .from(table.examAnswers)
      .where(eq(table.examAnswers.sessionId, sessionId));

    if (answers.length === 0)
      throw new BadRequestError("No answers found for this session");

    const questionIds = answers.map((a) => a.questionId);
    const rows = await tx
      .select({
        id: table.questions.id,
        skill: table.questions.skill,
        answerKey: table.questions.answerKey,
      })
      .from(table.questions)
      .where(inArray(table.questions.id, questionIds));

    const questionsMap = new Map(
      rows.map((q) => [q.id, { skill: q.skill, answerKey: q.answerKey }]),
    );

    const grade = gradeAnswers(answers, questionsMap);

    await persistCorrectness(tx, sessionId, grade.correctness);

    const listeningScore = calculateScore(
      grade.listeningCorrect,
      grade.listeningTotal,
    );
    const readingScore = calculateScore(
      grade.readingCorrect,
      grade.readingTotal,
    );

    const pending = [
      ...grade.writing.map((a) => ({ ...a, skill: "writing" as const })),
      ...grade.speaking.map((a) => ({ ...a, skill: "speaking" as const })),
    ];

    if (pending.length > 0) {
      const inserted = await tx
        .insert(table.submissions)
        .values(
          pending.map((a) => ({
            userId: session.userId,
            questionId: a.questionId,
            skill: a.skill,
            status: "pending" as const,
          })),
        )
        .returning({ id: table.submissions.id });

      const pairs = inserted.map((sub, i) => ({
        sub,
        pending: assertExists(pending[i], "Pending answer"),
      }));

      await tx.insert(table.submissionDetails).values(
        pairs.map(({ sub, pending: p }) => ({
          submissionId: sub.id,
          answer: p.answer,
        })),
      );

      await tx.insert(table.examSubmissions).values(
        pairs.map(({ sub, pending: p }) => ({
          sessionId,
          submissionId: sub.id,
          skill: p.skill,
        })),
      );

      for (const { pending: p } of pairs) {
        if (!p.answer || typeof p.answer !== "object") {
          throw new BadRequestError(
            `Invalid answer format for ${p.skill} question ${p.questionId}`,
          );
        }
      }

      await Promise.all(
        pairs.map(({ sub, pending: p }) =>
          dispatchGrading(tx, sub.id, p.skill, p.questionId, p.answer),
        ),
      );
    }

    const ts = new Date().toISOString();
    const status: ExamSessionStatus =
      pending.length > 0 ? "submitted" : "completed";
    const updated = await tx
      .update(table.examSessions)
      .set({
        listeningScore,
        readingScore,
        status,
        completedAt: ts,
        updatedAt: ts,
      })
      .where(
        and(
          eq(table.examSessions.id, sessionId),
          eq(table.examSessions.status, "in_progress"),
        ),
      )
      .returning(SESSION_COLUMNS)
      .then(takeFirstOrThrow);

    if (listeningScore !== null) {
      await record(session.userId, "listening", null, listeningScore, tx);
      await sync(session.userId, "listening", tx);
    }
    if (readingScore !== null) {
      await record(session.userId, "reading", null, readingScore, tx);
      await sync(session.userId, "reading", tx);
    }

    return updated;
  });
}
