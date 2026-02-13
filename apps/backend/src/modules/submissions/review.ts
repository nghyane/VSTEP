// TODO(P1): Record submissionEvents on claim/release/review transitions
//   - Insert into submissionEvents table with kind + data JSONB
//   - Kinds: "claimed", "released", "manually_graded"

import type { Actor } from "@common/auth-types";
import { ROLES } from "@common/auth-types";
import { BadRequestError, ConflictError, ForbiddenError } from "@common/errors";
import { scoreToBand } from "@common/scoring";
import { assertExists } from "@common/utils";
import { db, notDeleted, paginated, table } from "@db/index";
import {
  and,
  asc,
  count,
  eq,
  isNull,
  lt,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
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

function bandIndex(band: string | null): number {
  const map: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5 };
  return band ? (map[band] ?? 0) : 0;
}

const priorityOrder = sql`CASE ${table.submissions.reviewPriority}
  WHEN 'critical' THEN 1 WHEN 'high' THEN 2
  WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END`;

export async function getReviewQueue(query: ReviewQueueQuery, _actor: Actor) {
  const where = and(
    ...[
      eq(table.submissions.status, "review_pending"),
      notDeleted(table.submissions),
      query.skill && eq(table.submissions.skill, query.skill),
      query.priority && eq(table.submissions.reviewPriority, query.priority),
    ].filter((c): c is SQL => Boolean(c)),
  );

  const pg = paginated(query.page, query.limit);
  return pg.resolve({
    count: db
      .select({ count: count() })
      .from(table.submissions)
      .where(where)
      .then((r) => r[0]?.count ?? 0),
    query: db
      .select(REVIEW_QUEUE_COLUMNS)
      .from(table.submissions)
      .where(where)
      .orderBy(priorityOrder, asc(table.submissions.createdAt))
      .limit(pg.limit)
      .offset(pg.offset),
  });
}

export async function claimSubmission(submissionId: string, actor: Actor) {
  return db.transaction(async (tx) => {
    // Existence check for proper 404
    assertExists(
      await tx.query.submissions.findFirst({
        where: and(
          eq(table.submissions.id, submissionId),
          eq(table.submissions.status, "review_pending"),
          notDeleted(table.submissions),
        ),
        columns: { id: true },
      }),
      "Submission",
    );

    // Atomic conditional update — no TOCTOU race
    const ts = new Date().toISOString();
    const [updated] = await tx
      .update(table.submissions)
      .set({ claimedBy: actor.sub, claimedAt: ts, updatedAt: ts })
      .where(
        and(
          eq(table.submissions.id, submissionId),
          eq(table.submissions.status, "review_pending"),
          notDeleted(table.submissions),
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
      .returning(SUBMISSION_COLUMNS);

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
          notDeleted(table.submissions),
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
    const [updated] = await tx
      .update(table.submissions)
      .set({ claimedBy: null, claimedAt: null, updatedAt: ts })
      .where(
        and(
          eq(table.submissions.id, submissionId),
          eq(table.submissions.status, "review_pending"),
          notDeleted(table.submissions),
          actor.is(ROLES.ADMIN)
            ? undefined
            : eq(table.submissions.claimedBy, actor.sub),
        ),
      )
      .returning(SUBMISSION_COLUMNS);

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
    const submission = assertExists(
      await tx.query.submissions.findFirst({
        where: and(
          eq(table.submissions.id, submissionId),
          notDeleted(table.submissions),
        ),
        columns: {
          id: true,
          status: true,
          userId: true,
          skill: true,
          score: true,
          band: true,
          confidence: true,
          claimedBy: true,
        },
      }),
      "Submission",
    );

    if (submission.status !== "review_pending") {
      throw new ConflictError(
        `Cannot review a submission with status "${submission.status}"`,
      );
    }

    if (submission.claimedBy !== actor.sub && !actor.is(ROLES.ADMIN)) {
      throw new ForbiddenError("You must claim this submission first");
    }

    // Fetch AI result from details
    const details = await fetchDetails(tx, submissionId);

    // Merge rule: AI vs human score
    const aiScore = submission.score;
    const humanScore = body.overallScore;
    let finalScore: number;
    let gradingMode: "human" | "hybrid";
    let auditFlag = false;

    if (aiScore != null) {
      const scoreDiff = Math.abs(aiScore - humanScore);
      const bandStepDiff = Math.abs(
        bandIndex(submission.band) - bandIndex(body.band ?? null),
      );

      if (scoreDiff <= 0.5 && bandStepDiff <= 1) {
        finalScore = aiScore * 0.4 + humanScore * 0.6;
        gradingMode = "hybrid";
      } else {
        finalScore = humanScore;
        gradingMode = "human";
        auditFlag = true;
      }
    } else {
      finalScore = humanScore;
      gradingMode = "human";
    }

    // Round to nearest 0.5
    finalScore = Math.round(finalScore * 2) / 2;
    const finalBand = body.band ?? scoreToBand(finalScore);

    const ts = new Date().toISOString();
    const [updated] = await tx
      .update(table.submissions)
      .set({
        score: finalScore,
        band: finalBand,
        status: "completed",
        completedAt: ts,
        updatedAt: ts,
        reviewerId: actor.sub,
        gradingMode,
        auditFlag,
      })
      .where(
        and(
          eq(table.submissions.id, submissionId),
          eq(table.submissions.status, "review_pending"),
          notDeleted(table.submissions),
          actor.is(ROLES.ADMIN)
            ? undefined
            : eq(table.submissions.claimedBy, actor.sub),
        ),
      )
      .returning(SUBMISSION_COLUMNS);

    if (!updated) {
      throw new ConflictError(
        "Submission was modified concurrently or claim expired",
      );
    }

    // Merge AI + human result in details
    const mergedResult = {
      ...(typeof details.result === "object" && details.result !== null
        ? details.result
        : {}),
      humanReview: {
        score: humanScore,
        band: body.band ?? null,
        criteriaScores: body.criteriaScores ?? null,
        feedback: body.feedback ?? null,
        reviewComment: body.reviewComment ?? null,
        reviewerId: actor.sub,
        reviewedAt: ts,
      },
      finalScore,
      gradingMode,
      auditFlag,
    };

    await tx
      .update(table.submissionDetails)
      .set({
        feedback: body.feedback ?? details.feedback,
        result: sql`${JSON.stringify(mergedResult)}::jsonb`,
      })
      .where(eq(table.submissionDetails.submissionId, submissionId));

    await recordSkillScore(
      submission.userId,
      submission.skill,
      submissionId,
      finalScore,
      tx,
    );
    await updateUserProgress(submission.userId, submission.skill, tx);

    return {
      ...assertExists(updated, "Submission"),
      ...(await fetchDetails(tx, submissionId)),
    };
  });
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
          notDeleted(table.submissions),
        ),
        columns: { id: true },
      }),
      "Submission",
    );

    // Verify the reviewer exists
    assertExists(
      await tx.query.users.findFirst({
        where: and(
          eq(table.users.id, body.reviewerId),
          notDeleted(table.users),
        ),
        columns: { id: true },
      }),
      "Reviewer",
    );

    const ts = new Date().toISOString();
    const [updated] = await tx
      .update(table.submissions)
      .set({ reviewerId: body.reviewerId, updatedAt: ts })
      .where(eq(table.submissions.id, submissionId))
      .returning(REVIEW_QUEUE_COLUMNS);

    return assertExists(updated, "Submission");
  });
}
