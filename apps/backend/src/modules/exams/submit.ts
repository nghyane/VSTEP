import type { Actor } from "@common/auth-types";
import { BadRequestError } from "@common/errors";
import { calculateScore } from "@common/scoring";
import { assertExists } from "@common/utils";
import { db, table, takeFirstOrThrow } from "@db/index";
import { and, eq, inArray } from "drizzle-orm";
import { record, sync } from "@/modules/progress/service";
import {
  dispatch,
  type GradingTask,
  prepare,
} from "@/modules/submissions/grading-dispatch";
import { gradeAnswers, persistCorrectness } from "./grading";
import { SESSION_COLUMNS } from "./schema";
import type { ExamSessionStatus } from "./service";
import { active } from "./session";

export async function submit(sessionId: string, actor: Actor) {
  const gradingTasks: GradingTask[] = [];
  const updated = await db.transaction(async (tx) => {
    const session = await active(tx, sessionId, actor);

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
    const questions = await tx
      .select({
        id: table.questions.id,
        skill: table.questions.skill,
        answerKey: table.questions.answerKey,
      })
      .from(table.questions)
      .where(inArray(table.questions.id, questionIds));

    const questionsMap = new Map(
      questions.map((q) => [q.id, { skill: q.skill, answerKey: q.answerKey }]),
    );

    const grade = gradeAnswers(answers, questionsMap);

    await persistCorrectness(tx, sessionId, grade.correctness);

    const listeningScore = calculateScore(
      grade.listening.correct,
      grade.listening.total,
    );
    const readingScore = calculateScore(
      grade.reading.correct,
      grade.reading.total,
    );

    const awaitingReview = grade.subjective;

    if (awaitingReview.length > 0) {
      const inserted = await tx
        .insert(table.submissions)
        .values(
          awaitingReview.map((a) => ({
            userId: session.userId,
            questionId: a.questionId,
            skill: a.skill,
            status: "pending" as const,
          })),
        )
        .returning({ id: table.submissions.id });

      const pairs = inserted.map((sub, i) => ({
        sub,
        entry: assertExists(awaitingReview[i], "Subjective answer"),
      }));

      await tx.insert(table.submissionDetails).values(
        pairs.map(({ sub, entry }) => ({
          submissionId: sub.id,
          answer: entry.answer,
        })),
      );

      await tx.insert(table.examSubmissions).values(
        pairs.map(({ sub, entry }) => ({
          sessionId,
          submissionId: sub.id,
          skill: entry.skill,
        })),
      );

      for (const { entry } of pairs) {
        if (!entry.answer || typeof entry.answer !== "object") {
          throw new BadRequestError(
            `Invalid answer format for ${entry.skill} question ${entry.questionId}`,
          );
        }
      }

      for (const { sub, entry } of pairs) {
        gradingTasks.push(
          await prepare(
            tx,
            sub.id,
            entry.skill,
            entry.questionId,
            entry.answer,
          ),
        );
      }
    }

    const ts = new Date().toISOString();
    const status: ExamSessionStatus =
      awaitingReview.length > 0 ? "submitted" : "completed";
    const result = await tx
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

    const progressUpdates: Promise<void>[] = [];
    if (listeningScore !== null) {
      progressUpdates.push(
        record(session.userId, "listening", null, listeningScore, tx).then(() =>
          sync(session.userId, "listening", tx),
        ),
      );
    }
    if (readingScore !== null) {
      progressUpdates.push(
        record(session.userId, "reading", null, readingScore, tx).then(() =>
          sync(session.userId, "reading", tx),
        ),
      );
    }
    if (progressUpdates.length > 0) await Promise.all(progressUpdates);

    return result;
  });
  await dispatch(gradingTasks);
  return updated;
}
