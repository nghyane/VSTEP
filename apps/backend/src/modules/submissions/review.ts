import type { Actor } from "@common/auth-types";
import { ROLES } from "@common/auth-types";
import { BadRequestError, ConflictError, ForbiddenError } from "@common/errors";
import { scoreToBand } from "@common/scoring";
import { assertExists } from "@common/utils";
import { db, paginate, table, takeFirst, takeFirstOrThrow } from "@db/index";
import { and, asc, eq, isNull, lt, or, sql } from "drizzle-orm";
import { record, sync } from "@/modules/progress/service";
import type {
  ReviewQueueQuery,
  SubmissionAssignBody,
  SubmissionReviewBody,
} from "./schema";
import { REVIEW_QUEUE_COLUMNS, SUBMISSION_COLUMNS } from "./schema";
import { details } from "./shared";

const CLAIM_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

const priorityOrder = sql`CASE ${table.submissions.reviewPriority}
  WHEN 'high' THEN 1 WHEN 'medium' THEN 2
  WHEN 'low' THEN 3 ELSE 4 END`;

export async function queue(query: ReviewQueueQuery, _actor: Actor) {
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

export async function claim(submissionId: string, actor: Actor) {
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

    return { ...updated, ...(await details(tx, submissionId)) };
  });
}

export async function release(submissionId: string, actor: Actor) {
  return db.transaction(async (tx) => {
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

    return { ...updated, ...(await details(tx, submissionId)) };
  });
}

export async function review(
  submissionId: string,
  body: SubmissionReviewBody,
  actor: Actor,
) {
  return db.transaction(async (tx) => {
    const [submission, det] = await Promise.all([
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
      details(tx, submissionId),
    ]);

    if (submission.status !== "review_pending") {
      throw new ConflictError(
        `Cannot review a submission with status "${submission.status}"`,
      );
    }
    if (submission.claimedBy !== actor.sub && !actor.is(ROLES.ADMIN)) {
      throw new ForbiddenError("You must claim this submission first");
    }

    const g = resolveHumanGrade(body, det.result, actor.sub);
    const ts = new Date().toISOString();

    const claimGuard = actor.is(ROLES.ADMIN)
      ? undefined
      : eq(table.submissions.claimedBy, actor.sub);

    const updated = await tx
      .update(table.submissions)
      .set({
        score: g.score,
        band: g.band,
        status: "completed",
        completedAt: ts,
        updatedAt: ts,
        reviewerId: actor.sub,
        gradingMode: "human",
        auditFlag: g.auditFlag,
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
        feedback: body.feedback ?? det.feedback,
        result: sql`${JSON.stringify(g.result)}::jsonb`,
      })
      .where(eq(table.submissionDetails.submissionId, submissionId));

    await record(
      submission.userId,
      submission.skill,
      submissionId,
      g.score,
      tx,
    );
    await sync(submission.userId, submission.skill, tx);

    return {
      ...updated,
      answer: det.answer,
      result: g.result,
      feedback: body.feedback ?? det.feedback,
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

export async function assign(
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
