import type { Actor } from "@common/auth-types";
import { ROLES } from "@common/auth-types";
import { BadRequestError, ConflictError } from "@common/errors";
import { assertAccess, assertExists } from "@common/utils";
import { db, paginate, table, takeFirstOrThrow } from "@db/index";
import { and, desc, eq } from "drizzle-orm";
import { dispatchGrading } from "./grading-dispatch";
import type {
  SubmissionCreateBody,
  SubmissionListQuery,
  SubmissionUpdateBody,
} from "./schema";
import { SUBMISSION_COLUMNS, SUBMISSION_EXCLUDE } from "./schema";
import {
  DETAIL_COLUMNS,
  details,
  MUTABLE_STATUSES,
  submissionMachine,
} from "./shared";

export async function find(submissionId: string, actor: Actor) {
  const row = assertExists(
    await db.query.submissions.findFirst({
      where: eq(table.submissions.id, submissionId),
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

export async function list(query: SubmissionListQuery, actor: Actor) {
  const where = and(
    !actor.is(ROLES.ADMIN)
      ? eq(table.submissions.userId, actor.sub)
      : undefined,
    actor.is(ROLES.ADMIN) && query.userId
      ? eq(table.submissions.userId, query.userId)
      : undefined,
    query.skill ? eq(table.submissions.skill, query.skill) : undefined,
    query.status ? eq(table.submissions.status, query.status) : undefined,
  );

  return paginate(
    db
      .select({ ...SUBMISSION_COLUMNS, ...DETAIL_COLUMNS })
      .from(table.submissions)
      .leftJoin(
        table.submissionDetails,
        eq(table.submissions.id, table.submissionDetails.submissionId),
      )
      .where(where)
      .orderBy(desc(table.submissions.createdAt))
      .$dynamic(),
    db.$count(table.submissions, where),
    query,
  );
}

export async function create(userId: string, body: SubmissionCreateBody) {
  return db.transaction(async (tx) => {
    const question = assertExists(
      await tx.query.questions.findFirst({
        where: eq(table.questions.id, body.questionId),
        columns: { id: true, skill: true, isActive: true },
      }),
      "Question",
    );

    if (!question.isActive) {
      throw new BadRequestError("Question is not active");
    }

    const submission = await tx
      .insert(table.submissions)
      .values({
        userId,
        questionId: body.questionId,
        skill: question.skill,
        status: "pending",
      })
      .returning(SUBMISSION_COLUMNS)
      .then(takeFirstOrThrow);

    await tx.insert(table.submissionDetails).values({
      submissionId: submission.id,
      answer: body.answer,
    });

    const result = {
      ...submission,
      answer: body.answer,
      result: null,
      feedback: null,
    };

    // Subjective skills need AI grading via worker queue
    if (question.skill === "writing" || question.skill === "speaking") {
      await dispatchGrading(
        tx,
        submission.id,
        question.skill,
        question.id,
        body.answer,
      );
    }

    return result;
  });
}

export async function update(
  submissionId: string,
  body: SubmissionUpdateBody,
  actor: Actor,
) {
  return db.transaction(async (tx) => {
    const submission = assertExists(
      await tx.query.submissions.findFirst({
        where: eq(table.submissions.id, submissionId),
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
    const status = actor.is(ROLES.ADMIN) ? body.status : undefined;

    if (status) submissionMachine.assertTransition(submission.status, status);

    const set = {
      updatedAt: ts,
      ...(status && { status }),
      ...(status === "completed" &&
        submission.status !== "completed" && { completedAt: ts }),
      ...(actor.is(ROLES.ADMIN) &&
        body.score !== undefined && {
          score: body.score,
          ...(!status &&
            submission.status !== "completed" && {
              status: "completed" as const,
              completedAt: ts,
            }),
        }),
      ...(actor.is(ROLES.ADMIN) &&
        body.band !== undefined && { band: body.band }),
    };

    const updated = await tx
      .update(table.submissions)
      .set(set)
      .where(eq(table.submissions.id, submissionId))
      .returning(SUBMISSION_COLUMNS)
      .then(takeFirstOrThrow);

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
      ...updated,
      ...(await details(tx, submissionId)),
    };
  });
}

export async function remove(submissionId: string, actor: Actor) {
  return db.transaction(async (tx) => {
    const submission = assertExists(
      await tx.query.submissions.findFirst({
        where: eq(table.submissions.id, submissionId),
        columns: { id: true, userId: true, status: true },
      }),
      "Submission",
    );

    assertAccess(
      submission.userId,
      actor,
      "You can only delete your own submissions",
    );

    if (
      submission.status === "completed" ||
      submission.status === "review_pending"
    ) {
      throw new ConflictError("Cannot delete a graded submission");
    }

    return tx
      .delete(table.submissions)
      .where(eq(table.submissions.id, submissionId))
      .returning({ id: table.submissions.id })
      .then(takeFirstOrThrow);
  });
}
