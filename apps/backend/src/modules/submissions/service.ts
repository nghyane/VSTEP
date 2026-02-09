import { assertAccess, assertExists, now } from "@common/utils";
import { Value } from "@sinclair/typebox/value";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  type SQL,
  sql,
} from "drizzle-orm";
import { db, notDeleted, omitColumns, pagination, table } from "@/db";
import {
  ObjectiveAnswer,
  ObjectiveAnswerKey,
} from "@/modules/questions/content-schemas";
import type { Actor } from "@/plugins/auth";
import { BadRequestError, ConflictError } from "@/plugins/error";
import type {
  SubmissionCreateBody,
  SubmissionGradeBody,
  SubmissionListQuery,
  SubmissionUpdateBody,
} from "./model";
import { scoreToBand } from "./pure";

const SUBMISSION_COLUMNS = omitColumns(getTableColumns(table.submissions), [
  "confidence",
  "isLate",
  "attempt",
  "requestId",
  "reviewPriority",
  "reviewerId",
  "gradingMode",
  "auditFlag",
  "claimedBy",
  "claimedAt",
  "deadline",
  "deletedAt",
]);

type SubmissionInsert = typeof table.submissions.$inferInsert;
type SubmissionSkill = "listening" | "reading" | "writing" | "speaking";
type SubmissionStatus =
  | "pending"
  | "queued"
  | "processing"
  | "completed"
  | "review_pending"
  | "error"
  | "retrying"
  | "failed";
type SubmissionBand = "A1" | "A2" | "B1" | "B2" | "C1" | null;

/**
 * Map a 0-10 score to VSTEP.3-5 proficiency bands.
 * Scores below 4.0 are treated as below B1 and return null.
 */
export { scoreToBand };

/**
 * Submission status state machine.
 * Each key lists the only allowed next statuses for transition validation.
 */
const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["queued", "failed"],
  queued: ["processing", "failed"],
  processing: ["completed", "review_pending", "error", "failed"],
  // biome-ignore lint/style/useNamingConvention: must match DB enum value
  review_pending: ["completed"],
  error: ["retrying"],
  retrying: ["processing", "failed"],
  completed: [],
  failed: [],
};

export function validateTransition(current: string, next: string) {
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed?.includes(next)) {
    throw new ConflictError(`Cannot transition from ${current} to ${next}`);
  }
}

export async function getSubmissionById(submissionId: string, actor: Actor) {
  const row = assertExists(
    await db.query.submissions.findFirst({
      where: and(
        eq(table.submissions.id, submissionId),
        notDeleted(table.submissions),
      ),
      with: { details: true },
    }),
    "Submission",
  );

  assertAccess(row.userId, actor, "You can only view your own submissions");

  const { details, ...submission } = row;
  return {
    ...submission,
    answer: details?.answer,
    result: details?.result,
    feedback: details?.feedback,
  };
}

export async function listSubmissions(
  query: SubmissionListQuery,
  actor: Actor,
) {
  const pg = pagination(query.page, query.limit);

  const conditions: SQL[] = [notDeleted(table.submissions)];

  if (!actor.is("admin")) {
    conditions.push(eq(table.submissions.userId, actor.sub));
  } else if (query.userId) {
    conditions.push(eq(table.submissions.userId, query.userId));
  }

  if (query.skill) {
    conditions.push(
      eq(table.submissions.skill, query.skill as SubmissionSkill),
    );
  }

  if (query.status) {
    conditions.push(
      eq(table.submissions.status, query.status as SubmissionStatus),
    );
  }

  const whereClause = and(...conditions);

  const [countResult, submissions] = await Promise.all([
    db.select({ count: count() }).from(table.submissions).where(whereClause),
    db
      .select({
        ...SUBMISSION_COLUMNS,
        answer: table.submissionDetails.answer,
        result: table.submissionDetails.result,
        feedback: table.submissionDetails.feedback,
      })
      .from(table.submissions)
      .leftJoin(
        table.submissionDetails,
        eq(table.submissions.id, table.submissionDetails.submissionId),
      )
      .where(whereClause)
      .orderBy(desc(table.submissions.createdAt))
      .limit(pg.limit)
      .offset(pg.offset),
  ]);

  const total = countResult[0]?.count ?? 0;

  return {
    data: submissions,
    meta: pg.meta(total),
  };
}

export async function createSubmission(
  userId: string,
  body: SubmissionCreateBody,
) {
  return db.transaction(async (tx) => {
    const questionRow = await tx.query.questions.findFirst({
      where: and(
        eq(table.questions.id, body.questionId),
        notDeleted(table.questions),
      ),
      columns: {
        id: true,
        skill: true,
        isActive: true,
      },
    });

    const question = assertExists(questionRow, "Question");

    if (!question.isActive) {
      throw new BadRequestError("Question is not active");
    }

    const [submission] = await tx
      .insert(table.submissions)
      .values({
        userId,
        questionId: body.questionId,
        skill: question.skill,
        status: "pending",
      })
      .returning(SUBMISSION_COLUMNS);

    const sub = assertExists(submission, "Submission");

    await tx.insert(table.submissionDetails).values({
      submissionId: sub.id,
      answer: body.answer,
    });

    return { ...sub, answer: body.answer, result: null, feedback: null };
  });
}

export async function updateSubmission(
  submissionId: string,
  body: SubmissionUpdateBody,
  actor: Actor,
) {
  return db.transaction(async (tx) => {
    const row = await tx.query.submissions.findFirst({
      where: and(
        eq(table.submissions.id, submissionId),
        notDeleted(table.submissions),
      ),
    });

    const submission = assertExists(row, "Submission");

    assertAccess(
      submission.userId,
      actor,
      "You can only update your own submissions",
    );

    const MUTABLE_STATUSES = ["pending", "error"];
    if (!MUTABLE_STATUSES.includes(submission.status) && !actor.is("admin")) {
      throw new ConflictError("Cannot update submission in current status");
    }

    const timestamp = now();
    const updateValues: Partial<SubmissionInsert> = {
      updatedAt: timestamp,
    };

    if (actor.is("admin")) {
      // Admin bypasses state machine — can force any transition
      if (body.status) {
        updateValues.status = body.status as SubmissionInsert["status"];
        if (body.status === "completed" && submission.status !== "completed") {
          updateValues.completedAt = timestamp;
        }
      }
      if (body.score !== undefined) updateValues.score = body.score;
      if (body.band !== undefined)
        updateValues.band = body.band as SubmissionBand;
    } else if (body.status) {
      validateTransition(submission.status, body.status as string);
    }

    const [updatedSubmission] = await tx
      .update(table.submissions)
      .set(updateValues)
      .where(eq(table.submissions.id, submissionId))
      .returning(SUBMISSION_COLUMNS);

    if (body.answer !== undefined || body.feedback !== undefined) {
      const updateDetails: Partial<
        typeof table.submissionDetails.$inferInsert
      > = {};
      if (body.answer !== undefined) updateDetails.answer = body.answer;
      if (body.feedback !== undefined) updateDetails.feedback = body.feedback;

      await tx
        .update(table.submissionDetails)
        .set(updateDetails)
        .where(eq(table.submissionDetails.submissionId, submissionId));
    }

    const updatedSub = assertExists(updatedSubmission, "Submission");

    // Use .returning() data where possible, fetch details only once
    const [details] = await tx
      .select({
        answer: table.submissionDetails.answer,
        result: table.submissionDetails.result,
        feedback: table.submissionDetails.feedback,
      })
      .from(table.submissionDetails)
      .where(eq(table.submissionDetails.submissionId, submissionId))
      .limit(1);

    return {
      ...updatedSub,
      answer: details?.answer ?? null,
      result: details?.result ?? null,
      feedback: details?.feedback ?? null,
    };
  });
}

export async function gradeSubmission(
  submissionId: string,
  body: SubmissionGradeBody,
) {
  return db.transaction(async (tx) => {
    const row = await tx.query.submissions.findFirst({
      where: and(
        eq(table.submissions.id, submissionId),
        notDeleted(table.submissions),
      ),
    });

    const submission = assertExists(row, "Submission");

    if (submission.status === "completed" || submission.status === "failed") {
      throw new ConflictError(
        `Cannot grade a submission with status "${submission.status}"`,
      );
    }

    if (body.score < 0 || body.score > 10) {
      throw new BadRequestError("Score must be between 0 and 10");
    }
    if ((body.score * 10) % 5 !== 0) {
      throw new BadRequestError("Score must be in 0.5 increments");
    }

    const timestamp = now();
    const [updatedSubmission] = await tx
      .update(table.submissions)
      .set({
        status: "completed",
        score: body.score,
        band: (body.band ?? scoreToBand(body.score)) as SubmissionBand,
        updatedAt: timestamp,
        completedAt: timestamp,
      })
      .where(eq(table.submissions.id, submissionId))
      .returning(SUBMISSION_COLUMNS);

    if (body.feedback) {
      await tx
        .update(table.submissionDetails)
        .set({ feedback: body.feedback })
        .where(eq(table.submissionDetails.submissionId, submissionId));
    }

    const updatedSub = assertExists(updatedSubmission, "Submission");

    const [details] = await tx
      .select({
        answer: table.submissionDetails.answer,
        result: table.submissionDetails.result,
        feedback: table.submissionDetails.feedback,
      })
      .from(table.submissionDetails)
      .where(eq(table.submissionDetails.submissionId, submissionId))
      .limit(1);

    return {
      ...updatedSub,
      answer: details?.answer ?? null,
      result: details?.result ?? null,
      feedback: details?.feedback ?? null,
    };
  });
}

export async function removeSubmission(submissionId: string, actor: Actor) {
  return db.transaction(async (tx) => {
    const row = await tx.query.submissions.findFirst({
      where: and(
        eq(table.submissions.id, submissionId),
        notDeleted(table.submissions),
      ),
    });

    const submission = assertExists(row, "Submission");

    assertAccess(
      submission.userId,
      actor,
      "You can only delete your own submissions",
    );

    const timestamp = now();
    await tx
      .update(table.submissions)
      .set({
        deletedAt: timestamp,
        updatedAt: timestamp,
      })
      .where(eq(table.submissions.id, submissionId));

    return { id: submissionId, deletedAt: timestamp };
  });
}

/**
 * Auto-grade objective listening/reading submissions by comparing JSONB answers in SQL.
 * Computes score as (correct/total) * 10, rounds to nearest 0.5, and persists result + completion state.
 */
export async function autoGradeSubmission(submissionId: string) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        id: table.submissions.id,
        status: table.submissions.status,
        skill: table.submissions.skill,
        answerKey: table.questions.answerKey,
        answer: table.submissionDetails.answer,
        correctCount: sql<number>`(
            SELECT count(*)
            FROM jsonb_each_text(${table.questions.answerKey} -> 'correctAnswers') ak
            JOIN jsonb_each_text(${table.submissionDetails.answer} -> 'answers') ua
              ON ak.key = ua.key
            WHERE lower(trim(ua.value)) = lower(trim(ak.value))
          )::int`,
        totalCount: sql<number>`(
            SELECT count(*)
            FROM jsonb_each_text(${table.questions.answerKey} -> 'correctAnswers')
          )::int`,
      })
      .from(table.submissions)
      .innerJoin(
        table.submissionDetails,
        eq(table.submissions.id, table.submissionDetails.submissionId),
      )
      .innerJoin(
        table.questions,
        eq(table.submissions.questionId, table.questions.id),
      )
      .where(eq(table.submissions.id, submissionId))
      .limit(1);

    const data = assertExists(row, "Submission");

    if (data.status === "completed" || data.status === "failed") {
      throw new ConflictError(
        `Cannot auto-grade a submission with status "${data.status}"`,
      );
    }

    if (data.skill !== "listening" && data.skill !== "reading") {
      throw new BadRequestError(
        "Only listening and reading submissions can be auto-graded",
      );
    }

    if (!data.answerKey) {
      throw new BadRequestError("Question has no answer key for auto-grading");
    }

    if (
      !Value.Check(ObjectiveAnswerKey, data.answerKey) ||
      !Value.Check(ObjectiveAnswer, data.answer)
    ) {
      throw new BadRequestError("Answer format incompatible with auto-grading");
    }

    const { correctCount, totalCount } = data;

    const rawScore = totalCount > 0 ? (correctCount / totalCount) * 10 : 0;
    const score = Math.round(rawScore * 2) / 2;
    const band = scoreToBand(score);

    const timestamp = now();
    const result = {
      correctCount,
      totalCount,
      score,
      band,
      gradedAt: timestamp,
    };

    await tx
      .update(table.submissions)
      .set({
        status: "completed",
        score,
        band,
        completedAt: timestamp,
        updatedAt: timestamp,
      })
      .where(eq(table.submissions.id, submissionId));

    await tx
      .update(table.submissionDetails)
      .set({ result })
      .where(eq(table.submissionDetails.submissionId, submissionId));

    return { score, result };
  });
}
