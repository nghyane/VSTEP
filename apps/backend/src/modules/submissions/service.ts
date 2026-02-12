import type { Actor } from "@common/auth-types";
import { ROLES } from "@common/auth-types";
import { BadRequestError, ConflictError } from "@common/errors";
import { scoreToBand } from "@common/scoring";
import { assertAccess, assertExists } from "@common/utils";
import type { DbTransaction } from "@db/index";
import { db, notDeleted, paginated, table } from "@db/index";
import { and, count, desc, eq, type SQL } from "drizzle-orm";
import type {
  SubmissionCreateBody,
  SubmissionGradeBody,
  SubmissionListQuery,
  SubmissionUpdateBody,
} from "./schema";
import { SUBMISSION_COLUMNS, SUBMISSION_EXCLUDE } from "./schema";

const DETAIL_COLUMNS = {
  answer: table.submissionDetails.answer,
  result: table.submissionDetails.result,
  feedback: table.submissionDetails.feedback,
};

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

const MUTABLE_STATUSES = ["pending", "error"];
const GRADABLE_STATUSES = ["review_pending", "processing"];

export function validateTransition(current: string, next: string) {
  if (!VALID_TRANSITIONS[current]?.includes(next)) {
    throw new ConflictError(`Cannot transition from ${current} to ${next}`);
  }
}

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

  assertAccess(row.userId, actor, "You can only view your own submissions");

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

    if (body.status) validateTransition(submission.status, body.status);

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
        columns: { id: true, status: true },
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

    return {
      ...assertExists(updated, "Submission"),
      ...(await fetchDetails(tx, submissionId)),
    };
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
