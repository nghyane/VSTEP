import { logger } from "@common/logger";
import {
  calculateOverallScore,
  scoreToBand,
  scoreToLevel,
} from "@common/scoring";
import type { DbTransaction } from "@db/index";
import { table } from "@db/index";
import { and, eq, inArray } from "drizzle-orm";
import { IN_FLIGHT_STATUSES } from "@/modules/submissions/shared";

/**
 * After a submission is graded, check if its parent exam session
 * can be finalized (all subjective submissions completed).
 * No-op if the submission is not exam-linked.
 */

/** VSTEP weighted: Task 1 weight=1, Task 2 weight=2. Formula: (t1 + t2×2) / 3 */
export function weightedWritingAvg(
  scores: { score: number; part: number | null }[],
): number | null {
  if (scores.length === 0) return null;
  let totalWeight = 0;
  let weightedSum = 0;
  for (const s of scores) {
    const w = s.part === 2 ? 2 : 1;
    weightedSum += s.score * w;
    totalWeight += w;
  }
  return Math.round((weightedSum / totalWeight) * 2) / 2;
}

function avgScore(scores: number[]): number | null {
  if (scores.length === 0) return null;
  const sum = scores.reduce((a, b) => a + b, 0);
  return Math.round((sum / scores.length) * 2) / 2;
}

export async function tryFinalizeSession(
  submissionId: string,
  tx: DbTransaction,
) {
  const link = await tx
    .select({
      sessionId: table.examSubmissions.sessionId,
    })
    .from(table.examSubmissions)
    .where(eq(table.examSubmissions.submissionId, submissionId))
    .limit(1)
    .then((rows) => rows[0]);

  if (!link) return; // standalone submission, not exam-linked

  const sessionId = link.sessionId;

  const pending = await tx
    .select({ id: table.submissions.id })
    .from(table.examSubmissions)
    .innerJoin(
      table.submissions,
      eq(table.examSubmissions.submissionId, table.submissions.id),
    )
    .where(
      and(
        eq(table.examSubmissions.sessionId, sessionId),
        inArray(table.submissions.status, IN_FLIGHT_STATUSES),
      ),
    )
    .limit(1);

  if (pending.length > 0) return;

  const skillScores = await tx
    .select({
      skill: table.examSubmissions.skill,
      score: table.submissions.score,
      part: table.examSubmissions.part,
    })
    .from(table.examSubmissions)
    .innerJoin(
      table.submissions,
      eq(table.examSubmissions.submissionId, table.submissions.id),
    )
    .where(eq(table.examSubmissions.sessionId, sessionId));

  const writingScores = skillScores
    .filter(
      (r): r is typeof r & { score: number } =>
        r.skill === "writing" && r.score !== null,
    )
    .map((r) => ({ score: r.score, part: r.part }));

  const speakingArr = skillScores
    .filter(
      (r): r is typeof r & { score: number } =>
        r.skill === "speaking" && r.score !== null,
    )
    .map((r) => r.score);

  const writingScore = weightedWritingAvg(writingScores);
  const speakingScore = avgScore(speakingArr);

  const session = await tx
    .select({
      id: table.examSessions.id,
      userId: table.examSessions.userId,
      examId: table.examSessions.examId,
      status: table.examSessions.status,
      listeningScore: table.examSessions.listeningScore,
      readingScore: table.examSessions.readingScore,
    })
    .from(table.examSessions)
    .where(
      and(
        eq(table.examSessions.id, sessionId),
        eq(table.examSessions.status, "submitted"),
      ),
    )
    .limit(1)
    .then((rows) => rows[0]);

  if (!session) return; // already completed or not in submitted state

  const overallScore = calculateOverallScore(
    session.listeningScore,
    session.readingScore,
    writingScore,
    speakingScore,
  );
  const overallBand = overallScore !== null ? scoreToBand(overallScore) : null;

  const ts = new Date().toISOString();
  await tx
    .update(table.examSessions)
    .set({
      writingScore,
      speakingScore,
      overallScore,
      overallBand,
      status: "completed",
      updatedAt: ts,
    })
    .where(
      and(
        eq(table.examSessions.id, sessionId),
        eq(table.examSessions.status, "submitted"),
      ),
    );

  logger.info("Session finalized", {
    sessionId,
    writingScore,
    speakingScore,
    overallScore,
    overallBand,
  });

  const exam = await tx
    .select({ type: table.exams.type })
    .from(table.exams)
    .where(eq(table.exams.id, session.examId))
    .limit(1)
    .then((rows) => rows[0]);

  if (exam?.type === "placement") {
    await writePlacement(tx, session.userId, sessionId, {
      listening: session.listeningScore,
      reading: session.readingScore,
      writing: writingScore,
      speaking: speakingScore,
    });
  }
}

export async function writePlacement(
  tx: DbTransaction,
  userId: string,
  sessionId: string,
  scores: {
    listening: number | null;
    reading: number | null;
    writing: number | null;
    speaking: number | null;
  },
) {
  const level = (score: number | null) => scoreToLevel(score ?? 0);

  await tx
    .insert(table.userPlacements)
    .values({
      userId,
      sessionId,
      status: "completed",
      listeningLevel: level(scores.listening),
      readingLevel: level(scores.reading),
      writingLevel: level(scores.writing),
      speakingLevel: level(scores.speaking),
      writingSource: "ai",
      speakingSource: "ai",
    })
    .onConflictDoUpdate({
      target: table.userPlacements.userId,
      set: {
        sessionId,
        status: "completed",
        listeningLevel: level(scores.listening),
        readingLevel: level(scores.reading),
        writingLevel: level(scores.writing),
        speakingLevel: level(scores.speaking),
        writingSource: "ai",
        speakingSource: "ai",
        updatedAt: new Date().toISOString(),
      },
    });

  logger.info("Placement recorded", { userId, sessionId });
}
