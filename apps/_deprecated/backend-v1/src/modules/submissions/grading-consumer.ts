import { env } from "@common/env";
import { logger } from "@common/logger";
import { scoreToBand } from "@common/scoring";
import { db, table, takeFirst } from "@db/index";
import type { AIResult } from "@db/types/grading";
import { redis } from "bun";
import { and, eq, inArray } from "drizzle-orm";
import { tryFinalizeSession } from "@/modules/exams/finalize";
import { record, sync } from "@/modules/progress/service";
import { GRADING_RESULTS_STREAM } from "./grading-streams";
import { GRADABLE_STATUSES } from "./shared";

const GROUP = "backend";
const CONSUMER = "backend-1";
const BLOCK_MS = 5000;

interface FailureResult {
  submissionId: string;
  failed: true;
}

type ConsumerMessage = GradeResult | FailureResult;

function isFailure(msg: ConsumerMessage): msg is FailureResult {
  return "failed" in msg && msg.failed === true;
}

interface GradeResult {
  submissionId: string;
  overallScore: number;
  band: string | null;
  criteriaScores: Record<string, number>;
  feedback: string;
  confidence: "high" | "medium" | "low";
  gradedAt: string | null;
  grammarErrors?: AIResult["grammarErrors"];
}

function resolveStatus(confidence: string): {
  status: "completed" | "review_pending";
  reviewPriority: "low" | "medium" | "high" | null;
} {
  if (confidence === "high")
    return { status: "completed", reviewPriority: null };
  if (confidence === "medium")
    return { status: "review_pending", reviewPriority: "medium" };
  return { status: "review_pending", reviewPriority: "high" };
}

async function ensureGroup() {
  try {
    await redis.send("XGROUP", [
      "CREATE",
      GRADING_RESULTS_STREAM,
      GROUP,
      "0",
      "MKSTREAM",
    ]);
  } catch (e: unknown) {
    if (e instanceof Error && !e.message.includes("BUSYGROUP")) throw e;
  }
}

async function handleFailure(submissionId: string) {
  const ts = new Date().toISOString();
  await db.transaction(async (tx) => {
    const updated = await tx
      .update(table.submissions)
      .set({ status: "failed", updatedAt: ts })
      .where(
        and(
          eq(table.submissions.id, submissionId),
          inArray(table.submissions.status, GRADABLE_STATUSES),
        ),
      )
      .returning({ id: table.submissions.id })
      .then(takeFirst);

    if (!updated) return;

    await tryFinalizeSession(submissionId, tx);
  });
  logger.warn("Submission marked as failed", { submissionId });
}

async function processResult(result: GradeResult) {
  const { status, reviewPriority } = resolveStatus(result.confidence);
  const ts = new Date().toISOString();
  const completedAt = status === "completed" ? ts : null;
  const band = (result.band ??
    scoreToBand(result.overallScore)) as AIResult["band"];

  await db.transaction(async (tx) => {
    const updated = await tx
      .update(table.submissions)
      .set({
        status,
        score: result.overallScore,
        band,
        gradingMode: "auto",
        reviewPriority,
        completedAt,
        updatedAt: ts,
      })
      .where(
        and(
          eq(table.submissions.id, result.submissionId),
          inArray(table.submissions.status, GRADABLE_STATUSES),
        ),
      )
      .returning({
        id: table.submissions.id,
        userId: table.submissions.userId,
        skill: table.submissions.skill,
      })
      .then(takeFirst);

    if (!updated) {
      logger.warn("Submission not gradable or already processed", {
        submissionId: result.submissionId,
      });
      return;
    }

    await tx
      .update(table.submissionDetails)
      .set({
        result: {
          type: "ai" as const,
          overallScore: result.overallScore,
          band,
          criteriaScores: result.criteriaScores,
          feedback: result.feedback,
          grammarErrors: result.grammarErrors ?? undefined,
          confidence: result.confidence,
          gradedAt: result.gradedAt ?? ts,
        } satisfies AIResult,
        feedback: result.feedback,
        updatedAt: ts,
      })
      .where(eq(table.submissionDetails.submissionId, result.submissionId));

    if (status === "completed") {
      await record(
        updated.userId,
        updated.skill,
        result.submissionId,
        null,
        result.overallScore,
        tx,
      );
      await sync(updated.userId, updated.skill, tx);
    }

    await tryFinalizeSession(result.submissionId, tx);
  });
}

let running = false;

export async function startGradingConsumer() {
  if (!env.REDIS_URL) {
    logger.warn("REDIS_URL not set, grading consumer disabled");
    return;
  }

  await ensureGroup();
  running = true;

  logger.info("Grading consumer started", {
    stream: GRADING_RESULTS_STREAM,
    group: GROUP,
  });

  while (running) {
    try {
      const response = await redis.send("XREADGROUP", [
        "GROUP",
        GROUP,
        CONSUMER,
        "COUNT",
        "10",
        "BLOCK",
        String(BLOCK_MS),
        "STREAMS",
        GRADING_RESULTS_STREAM,
        ">",
      ]);

      if (!response) continue;

      const streams = response as [string, [string, string[]][]][];
      for (const [, messages] of streams) {
        for (const [messageId, fields] of messages) {
          try {
            const payloadIdx = fields.indexOf("payload");
            if (payloadIdx === -1 || payloadIdx + 1 >= fields.length) {
              logger.error("Invalid message format", { messageId });
              await redis.send("XACK", [
                GRADING_RESULTS_STREAM,
                GROUP,
                messageId,
              ]);
              continue;
            }

            const raw = fields[payloadIdx + 1] as string;
            const parsed: ConsumerMessage = JSON.parse(raw);
            if (isFailure(parsed)) {
              await handleFailure(parsed.submissionId);
              await redis.send("XACK", [
                GRADING_RESULTS_STREAM,
                GROUP,
                messageId,
              ]);
              continue;
            }
            await processResult(parsed);
            await redis.send("XACK", [
              GRADING_RESULTS_STREAM,
              GROUP,
              messageId,
            ]);
          } catch (e) {
            logger.error("Failed to process grading result", {
              messageId,
              error: e instanceof Error ? e.message : String(e),
            });
          }
        }
      }
    } catch (e) {
      if (!running) break;
      logger.error("Consumer error", {
        error: e instanceof Error ? e.message : String(e),
      });
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }
}

export function stopGradingConsumer() {
  running = false;
}
