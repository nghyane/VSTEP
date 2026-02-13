// TODO(P1): Record submissionEvents on every status transition
//   - Insert into submissionEvents table with kind + data JSONB
//   - Kinds: "created", "status_changed", "auto_graded", "manually_graded", "claimed", "released"
//   - Currently submissionEvents table is defined but never populated

import type { Actor } from "@common/auth-types";
import { ROLES } from "@common/auth-types";
import { BadRequestError, ConflictError, ForbiddenError } from "@common/errors";
import { scoreToBand } from "@common/scoring";
import { createStateMachine } from "@common/state-machine";
import { assertAccess, assertExists } from "@common/utils";
import type { DbTransaction } from "@db/index";
import { db, notDeleted, paginated, table } from "@db/index";
import type { submissionStatusEnum } from "@db/schema/submissions";
import {
  and,
  asc,
  count,
  desc,
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
  SubmissionCreateBody,
  SubmissionGradeBody,
  SubmissionListQuery,
  SubmissionReviewBody,
  SubmissionUpdateBody,
} from "./schema";
import {
  REVIEW_QUEUE_COLUMNS,
  SUBMISSION_COLUMNS,
  SUBMISSION_EXCLUDE,
} from "./schema";

const DETAIL_COLUMNS = {
  answer: table.submissionDetails.answer,
  result: table.submissionDetails.result,
  feedback: table.submissionDetails.feedback,
};

type SubmissionStatus = (typeof submissionStatusEnum.enumValues)[number];

export const submissionMachine = createStateMachine<SubmissionStatus>({
  pending: ["queued", "failed"],
  queued: ["processing", "failed"],
  processing: ["completed", "review_pending", "error", "failed"],
  // biome-ignore lint/style/useNamingConvention: must match DB enum value
  review_pending: ["completed"],
  error: ["retrying"],
  retrying: ["processing", "failed"],
  completed: [],
  failed: [],
});

const MUTABLE_STATUSES: SubmissionStatus[] = ["pending", "error"];
const GRADABLE_STATUSES: SubmissionStatus[] = ["review_pending", "processing"];
const CLAIM_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

function bandIndex(band: string | null): number {
  const map: Record<string, number> = { A1: 1, A2: 2, B1: 3, B2: 4, C1: 5 };
  return band ? (map[band] ?? 0) : 0;
}

const priorityOrder = sql`CASE ${table.submissions.reviewPriority}
  WHEN 'critical' THEN 1 WHEN 'high' THEN 2
  WHEN 'medium' THEN 3 WHEN 'low' THEN 4 ELSE 5 END`;

async function fetchDetails(tx: DbTransaction, submissionId: string) {
  const [row] = await tx
    .select(DETAIL_COLUMNS)
    .from(table.submissionDetails)
    .where(eq(table.submissionDetails.submissionId, submissionId))
    .limit(1);

  return {
    answer: row?.answer ?? null,
    result: row?.result ?? null,
    feedback: row?.feedback ?? null,
  };
}

export async function getSubmissionById(submissionId: string, actor: Actor) {
  const row = assertExists(
    await db.query.submissions.findFirst({
      where: and(
        eq(table.submissions.id, submissionId),
        notDeleted(table.submissions),
      ),
      columns: SUBMISSION_EXCLUDE,
      with: {
        details: { columns: { answer: true, result: true, feedback: true } },
      },
    }),
    "Submission",
  );

  if (!actor.is(ROLES.ADMIN)) {
    assertAccess(row.userId, actor, "You can only view your own submissions");
  }

  const { details: d, ...sub } = row;
  return {
    ...sub,
    answer: d?.answer ?? null,
    result: d?.result ?? null,
    feedback: d?.feedback ?? null,
  };
}

export async function listSubmissions(
  query: SubmissionListQuery,
  actor: Actor,
) {
  const where = and(
    ...[
      notDeleted(table.submissions),
      !actor.is(ROLES.ADMIN) && eq(table.submissions.userId, actor.sub),
      actor.is(ROLES.ADMIN) &&
        query.userId &&
        eq(table.submissions.userId, query.userId),
      query.skill && eq(table.submissions.skill, query.skill),
      query.status && eq(table.submissions.status, query.status),
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
      .select({ ...SUBMISSION_COLUMNS, ...DETAIL_COLUMNS })
      .from(table.submissions)
      .leftJoin(
        table.submissionDetails,
        eq(table.submissions.id, table.submissionDetails.submissionId),
      )
      .where(where)
      .orderBy(desc(table.submissions.createdAt))
      .limit(pg.limit)
      .offset(pg.offset),
  });
}

export async function createSubmission(
  userId: string,
  body: SubmissionCreateBody,
) {
  return db.transaction(async (tx) => {
    const question = assertExists(
      await tx.query.questions.findFirst({
        where: and(
          eq(table.questions.id, body.questionId),
          notDeleted(table.questions),
        ),
        columns: { id: true, skill: true, isActive: true },
      }),
      "Question",
    );

    if (!question.isActive) {
      throw new BadRequestError("Question is not active");
    }

    const [sub] = await tx
      .insert(table.submissions)
      .values({
        userId,
        questionId: body.questionId,
        skill: question.skill,
        status: "pending",
      })
      .returning(SUBMISSION_COLUMNS);

    const submission = assertExists(sub, "Submission");

    await tx.insert(table.submissionDetails).values({
      submissionId: submission.id,
      answer: body.answer,
    });

    return { ...submission, answer: body.answer, result: null, feedback: null };
  });
}

export async function updateSubmission(
  submissionId: string,
  body: SubmissionUpdateBody,
  actor: Actor,
) {
  return db.transaction(async (tx) => {
    const submission = assertExists(
      await tx.query.submissions.findFirst({
        where: and(
          eq(table.submissions.id, submissionId),
          notDeleted(table.submissions),
        ),
        columns: { id: true, userId: true, status: true },
      }),
      "Submission",
    );

    assertAccess(
      submission.userId,
      actor,
      "You can only update your own submissions",
    );

    if (
      !MUTABLE_STATUSES.includes(submission.status) &&
      !actor.is(ROLES.ADMIN)
    ) {
      throw new ConflictError("Cannot update submission in current status");
    }

    const ts = new Date().toISOString();

    if (body.status)
      submissionMachine.assertTransition(submission.status, body.status);

    const set = {
      updatedAt: ts,
      ...(body.status && { status: body.status }),
      ...(body.status === "completed" &&
        submission.status !== "completed" && { completedAt: ts }),
      ...(actor.is(ROLES.ADMIN) &&
        body.score !== undefined && {
          score: body.score,
          ...(!body.status &&
            submission.status !== "completed" && {
              status: "completed" as const,
              completedAt: ts,
            }),
        }),
      ...(actor.is(ROLES.ADMIN) &&
        body.band !== undefined && { band: body.band }),
    };

    const [updated] = await tx
      .update(table.submissions)
      .set(set)
      .where(eq(table.submissions.id, submissionId))
      .returning(SUBMISSION_COLUMNS);

    if (body.answer !== undefined || body.feedback !== undefined) {
      await tx
        .update(table.submissionDetails)
        .set({
          ...(body.answer !== undefined && { answer: body.answer }),
          ...(body.feedback !== undefined && { feedback: body.feedback }),
        })
        .where(eq(table.submissionDetails.submissionId, submissionId));
    }

    return {
      ...assertExists(updated, "Submission"),
      ...(await fetchDetails(tx, submissionId)),
    };
  });
}

export async function gradeSubmission(
  submissionId: string,
  body: SubmissionGradeBody,
) {
  return db.transaction(async (tx) => {
    const submission = assertExists(
      await tx.query.submissions.findFirst({
        where: and(
          eq(table.submissions.id, submissionId),
          notDeleted(table.submissions),
        ),
        columns: { id: true, status: true, userId: true, skill: true },
      }),
      "Submission",
    );

    if (!GRADABLE_STATUSES.includes(submission.status)) {
      throw new ConflictError(
        `Cannot grade a submission with status "${submission.status}"`,
      );
    }

    const ts = new Date().toISOString();
    const [updated] = await tx
      .update(table.submissions)
      .set({
        status: "completed",
        score: body.score,
        band: body.band ?? scoreToBand(body.score),
        updatedAt: ts,
        completedAt: ts,
      })
      .where(eq(table.submissions.id, submissionId))
      .returning(SUBMISSION_COLUMNS);

    if (body.feedback) {
      await tx
        .update(table.submissionDetails)
        .set({ feedback: body.feedback })
        .where(eq(table.submissionDetails.submissionId, submissionId));
    }

    await recordSkillScore(
      submission.userId,
      submission.skill,
      submissionId,
      body.score,
      tx,
    );
    await updateUserProgress(submission.userId, submission.skill, tx);

    return {
      ...assertExists(updated, "Submission"),
      ...(await fetchDetails(tx, submissionId)),
    };
  });
}

// ---------------------------------------------------------------------------
// Review Queue
// ---------------------------------------------------------------------------

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

export async function removeSubmission(submissionId: string, actor: Actor) {
  return db.transaction(async (tx) => {
    const submission = assertExists(
      await tx.query.submissions.findFirst({
        where: and(
          eq(table.submissions.id, submissionId),
          notDeleted(table.submissions),
        ),
        columns: { id: true, userId: true },
      }),
      "Submission",
    );

    assertAccess(
      submission.userId,
      actor,
      "You can only delete your own submissions",
    );

    const ts = new Date().toISOString();
    const [deleted] = await tx
      .update(table.submissions)
      .set({ deletedAt: ts, updatedAt: ts })
      .where(eq(table.submissions.id, submissionId))
      .returning({
        id: table.submissions.id,
        deletedAt: table.submissions.deletedAt,
      });

    const removed = assertExists(deleted, "Submission");
    return { id: removed.id, deletedAt: removed.deletedAt ?? ts };
  });
}
