import type { Actor } from "@common/auth-types";
import { ROLES } from "@common/auth-types";
import { BadRequestError, ConflictError } from "@common/errors";
import { assertAccess, assertExists, now } from "@common/utils";
import type { DbTransaction } from "@db/index";
import { db, notDeleted, table } from "@db/index";
import { paginatedQuery } from "@db/repos";
import { submissionView } from "@db/views";
import { and, count, desc, eq, type SQL } from "drizzle-orm";
import { SUBMISSION_MESSAGES } from "./messages";
import type {
  SubmissionCreateBody,
  SubmissionGradeBody,
  SubmissionListQuery,
  SubmissionUpdateBody,
} from "./schema";
import { scoreToBand } from "./scoring";

const DETAIL_COLUMNS = {
  answer: table.submissionDetails.answer,
  result: table.submissionDetails.result,
  feedback: table.submissionDetails.feedback,
};

type SubmissionInsert = typeof table.submissions.$inferInsert;

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
  const allowed = VALID_TRANSITIONS[current];
  if (!allowed?.includes(next)) {
    throw new ConflictError(
      SUBMISSION_MESSAGES.invalidTransition(current, next),
    );
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
      columns: submissionView.queryColumns,
      with: {
        details: { columns: { answer: true, result: true, feedback: true } },
      },
    }),
    "Submission",
  );

  assertAccess(row.userId, actor, SUBMISSION_MESSAGES.viewOwn);

  const { details, ...submission } = row;
  return {
    ...submission,
    answer: details?.answer ?? null,
    result: details?.result ?? null,
    feedback: details?.feedback ?? null,
  };
}

export async function listSubmissions(
  query: SubmissionListQuery,
  actor: Actor,
) {
  const conditions: SQL[] = [notDeleted(table.submissions)];

  if (!actor.is(ROLES.ADMIN)) {
    conditions.push(eq(table.submissions.userId, actor.sub));
  } else if (query.userId) {
    conditions.push(eq(table.submissions.userId, query.userId));
  }

  if (query.skill) {
    conditions.push(eq(table.submissions.skill, query.skill));
  }

  if (query.status) {
    conditions.push(eq(table.submissions.status, query.status));
  }

  const whereClause = and(...conditions);

  const pg = paginatedQuery(query.page, query.limit);
  return pg.resolve({
    count: db
      .select({ count: count() })
      .from(table.submissions)
      .where(whereClause)
      .then((result) => result[0]?.count ?? 0),
    query: db
      .select({ ...submissionView.columns, ...DETAIL_COLUMNS })
      .from(table.submissions)
      .leftJoin(
        table.submissionDetails,
        eq(table.submissions.id, table.submissionDetails.submissionId),
      )
      .where(whereClause)
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
      throw new BadRequestError(SUBMISSION_MESSAGES.questionNotActive);
    }

    const [submission] = await tx
      .insert(table.submissions)
      .values({
        userId,
        questionId: body.questionId,
        skill: question.skill,
        status: "pending",
      })
      .returning(submissionView.columns);

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
      columns: { id: true, userId: true, status: true },
    });

    const submission = assertExists(row, "Submission");

    assertAccess(submission.userId, actor, SUBMISSION_MESSAGES.updateOwn);

    if (
      !MUTABLE_STATUSES.includes(submission.status) &&
      !actor.is(ROLES.ADMIN)
    ) {
      throw new ConflictError(SUBMISSION_MESSAGES.cannotUpdateInCurrentStatus);
    }

    const timestamp = now();
    const updateValues: Partial<SubmissionInsert> = {
      updatedAt: timestamp,
    };

    if (body.status) {
      validateTransition(submission.status, body.status);
      updateValues.status = body.status;
      if (body.status === "completed" && submission.status !== "completed") {
        updateValues.completedAt = timestamp;
      }
    }

    if (actor.is(ROLES.ADMIN)) {
      if (body.score !== undefined) {
        if (submission.status !== "completed" && !body.status) {
          updateValues.status = "completed";
          updateValues.completedAt = timestamp;
        }
        updateValues.score = body.score;
      }
      if (body.band !== undefined) updateValues.band = body.band;
    }

    const [updatedSubmission] = await tx
      .update(table.submissions)
      .set(updateValues)
      .where(eq(table.submissions.id, submissionId))
      .returning(submissionView.columns);

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

    return { ...updatedSub, ...(await fetchDetails(tx, submissionId)) };
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
      columns: { id: true, status: true },
    });

    const submission = assertExists(row, "Submission");

    if (!GRADABLE_STATUSES.includes(submission.status)) {
      throw new ConflictError(
        SUBMISSION_MESSAGES.cannotGradeStatus(submission.status),
      );
    }

    const timestamp = now();
    const [updatedSubmission] = await tx
      .update(table.submissions)
      .set({
        status: "completed",
        score: body.score,
        band: body.band ?? scoreToBand(body.score),
        updatedAt: timestamp,
        completedAt: timestamp,
      })
      .where(eq(table.submissions.id, submissionId))
      .returning(submissionView.columns);

    if (body.feedback) {
      await tx
        .update(table.submissionDetails)
        .set({ feedback: body.feedback })
        .where(eq(table.submissionDetails.submissionId, submissionId));
    }

    const updatedSub = assertExists(updatedSubmission, "Submission");

    return { ...updatedSub, ...(await fetchDetails(tx, submissionId)) };
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

    assertAccess(submission.userId, actor, SUBMISSION_MESSAGES.deleteOwn);

    const timestamp = now();
    const [deleted] = await tx
      .update(table.submissions)
      .set({
        deletedAt: timestamp,
        updatedAt: timestamp,
      })
      .where(eq(table.submissions.id, submissionId))
      .returning({
        id: table.submissions.id,
        deletedAt: table.submissions.deletedAt,
      });

    const removed = assertExists(deleted, "Submission");
    return { id: removed.id, deletedAt: removed.deletedAt ?? timestamp };
  });
}
