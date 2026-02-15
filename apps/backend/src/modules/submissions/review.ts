import type { Actor } from "@common/auth-types";
import { ROLES } from "@common/auth-types";
import { BadRequestError, ConflictError, ForbiddenError } from "@common/errors";
import { scoreToBand } from "@common/scoring";
import { assertExists } from "@common/utils";
import { db, paginate, table, takeFirst, takeFirstOrThrow } from "@db/index";
import { and, asc, eq, isNull, lt, or, sql } from "drizzle-orm";
import {
  recordSkillScore,
  updateUserProgress,
} from "@/modules/progress/service";
import type {
  ReviewQueueQuery,
  SubmissionAssignBody,
  SubmissionReviewBody,
} from "./schema";
import { REVIEW_QUEUE_COLUMNS, SUBMISSION_COLUMNS } from "./schema";
import { fetchDetails } from "./service";

const CLAIM_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

const priorityOrder = sql`CASE ${table.submissions.reviewPriority}
  WHEN 'high' THEN 1 WHEN 'medium' THEN 2
  WHEN 'low' THEN 3 ELSE 4 END`;

export async function getReviewQueue(query: ReviewQueueQuery, _actor: Actor) {
  const where = and(
    eq(table.submissions.status, "review_pending"),
    query.skill ? eq(table.submissions.skill, query.skill) : undefined,
    query.priority
      ? eq(table.submissions.reviewPriority, query.priority)
      : undefined,
  );

  return paginate(
    db
      .select(REVIEW_QUEUE_COLUMNS)
      .from(table.submissions)
      .where(where)
      .orderBy(priorityOrder, asc(table.submissions.createdAt))
      .$dynamic(),
    db.$count(table.submissions, where),
    query,
  );
}

export async function claimSubmission(submissionId: string, actor: Actor) {
  return db.transaction(async (tx) => {
    // Existence check for proper 404
    assertExists(
      await tx.query.submissions.findFirst({
        where: and(
          eq(table.submissions.id, submissionId),
          eq(table.submissions.status, "review_pending"),
        ),
        columns: { id: true },
      }),
      "Submission",
    );

    // Atomic conditional update — no TOCTOU race
    const ts = new Date().toISOString();
    const updated = await tx
      .update(table.submissions)
      .set({ claimedBy: actor.sub, claimedAt: ts, updatedAt: ts })
      .where(
        and(
          eq(table.submissions.id, submissionId),
          eq(table.submissions.status, "review_pending"),
          or(
            isNull(table.submissions.claimedBy),
            lt(
              table.submissions.claimedAt,
              new Date(Date.now() - CLAIM_TIMEOUT_MS).toISOString(),
            ),
            eq(table.submissions.claimedBy, actor.sub),
          ),
        ),
      )
      .returning(SUBMISSION_COLUMNS)
      .then(takeFirst);

    if (!updated) {
      throw new ConflictError(
        "Submission is already claimed by another reviewer",
      );
    }

    return { ...updated, ...(await fetchDetails(tx, submissionId)) };
  });
}

export async function releaseSubmission(submissionId: string, actor: Actor) {
  return db.transaction(async (tx) => {
    // Existence + state check for proper 404 / 400
    const submission = assertExists(
      await tx.query.submissions.findFirst({
        where: and(
          eq(table.submissions.id, submissionId),
          eq(table.submissions.status, "review_pending"),
        ),
        columns: { id: true, claimedBy: true },
      }),
      "Submission",
    );

    if (!submission.claimedBy) {
      throw new BadRequestError("Submission is not currently claimed");
    }

    // Atomic conditional update — owner or admin only
    const ts = new Date().toISOString();
    const updated = await tx
      .update(table.submissions)
      .set({ claimedBy: null, claimedAt: null, updatedAt: ts })
      .where(
        and(
          eq(table.submissions.id, submissionId),
          eq(table.submissions.status, "review_pending"),
          actor.is(ROLES.ADMIN)
            ? undefined
            : eq(table.submissions.claimedBy, actor.sub),
        ),
      )
      .returning(SUBMISSION_COLUMNS)
      .then(takeFirst);

    if (!updated) {
      throw new ForbiddenError(
        "You can only release submissions you have claimed",
      );
    }

    return { ...updated, ...(await fetchDetails(tx, submissionId)) };
  });
}

export async function submitReview(
  submissionId: string,
  body: SubmissionReviewBody,
  actor: Actor,
) {
  return db.transaction(async (tx) => {
    const [submission, details] = await Promise.all([
      tx.query.submissions
        .findFirst({
          where: eq(table.submissions.id, submissionId),
          columns: {
            id: true,
            status: true,
            userId: true,
            skill: true,
            claimedBy: true,
          },
        })
        .then((s) => assertExists(s, "Submission")),
      fetchDetails(tx, submissionId),
    ]);

    if (submission.status !== "review_pending") {
      throw new ConflictError(
        `Cannot review a submission with status "${submission.status}"`,
      );
    }
    if (submission.claimedBy !== actor.sub && !actor.is(ROLES.ADMIN)) {
      throw new ForbiddenError("You must claim this submission first");
    }

    const grade = resolveHumanGrade(body, details.result, actor.sub);
    const ts = new Date().toISOString();

    const claimGuard = actor.is(ROLES.ADMIN)
      ? undefined
      : eq(table.submissions.claimedBy, actor.sub);

    const updated = await tx
      .update(table.submissions)
      .set({
        score: grade.score,
        band: grade.band,
        status: "completed",
        completedAt: ts,
        updatedAt: ts,
        reviewerId: actor.sub,
        gradingMode: "human",
        auditFlag: grade.auditFlag,
      })
      .where(
        and(
          eq(table.submissions.id, submissionId),
          eq(table.submissions.status, "review_pending"),
          claimGuard,
        ),
      )
      .returning(SUBMISSION_COLUMNS)
      .then(takeFirst);

    if (!updated) {
      throw new ConflictError(
        "Submission was modified concurrently or claim expired",
      );
    }

    await tx
      .update(table.submissionDetails)
      .set({
        feedback: body.feedback ?? details.feedback,
        result: sql`${JSON.stringify(grade.result)}::jsonb`,
      })
      .where(eq(table.submissionDetails.submissionId, submissionId));

    await recordSkillScore(
      submission.userId,
      submission.skill,
      submissionId,
      grade.score,
      tx,
    );
    await updateUserProgress(submission.userId, submission.skill, tx);

    return {
      ...updated,
      answer: details.answer,
      result: grade.result,
      feedback: body.feedback ?? details.feedback,
    };
  });
}

function resolveHumanGrade(
  body: SubmissionReviewBody,
  aiResult: unknown,
  reviewerId: string,
) {
  const score = Math.round(body.overallScore * 2) / 2;
  const band = body.band ?? scoreToBand(score);

  const existing =
    typeof aiResult === "object" && aiResult !== null
      ? (aiResult as Record<string, unknown>)
      : null;

  const aiScore =
    existing && typeof existing.overallScore === "number"
      ? existing.overallScore
      : null;
  const auditFlag =
    aiScore != null && Math.abs(aiScore - body.overallScore) > 0.5;

  const result = {
    ...(existing ?? {}),
    overallScore: body.overallScore,
    band,
    criteriaScores: body.criteriaScores,
    feedback: body.feedback,
    reviewComment: body.reviewComment,
    reviewerId,
    reviewedAt: new Date().toISOString(),
    ...(aiScore != null && { aiScore }),
  };

  return { score, band, auditFlag, result };
}

export async function assignSubmission(
  submissionId: string,
  body: SubmissionAssignBody,
  _actor: Actor,
) {
  return db.transaction(async (tx) => {
    assertExists(
      await tx.query.submissions.findFirst({
        where: and(
          eq(table.submissions.id, submissionId),
          eq(table.submissions.status, "review_pending"),
        ),
        columns: { id: true },
      }),
      "Submission",
    );

    // Verify the reviewer exists
    assertExists(
      await tx.query.users.findFirst({
        where: eq(table.users.id, body.reviewerId),
        columns: { id: true },
      }),
      "Reviewer",
    );

    const ts = new Date().toISOString();
    return tx
      .update(table.submissions)
      .set({ reviewerId: body.reviewerId, updatedAt: ts })
      .where(eq(table.submissions.id, submissionId))
      .returning(REVIEW_QUEUE_COLUMNS)
      .then(takeFirstOrThrow);
  });
}
