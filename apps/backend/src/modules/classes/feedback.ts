import type { Actor } from "@common/auth-types";
import { ROLES } from "@common/auth-types";
import { BadRequestError, ForbiddenError } from "@common/errors";
import { assertExists } from "@common/utils";
import { db, paginate, table, takeFirstOrThrow } from "@db/index";
import { and, desc, eq, isNull } from "drizzle-orm";
import type { CreateFeedbackBody, FeedbackListQuery } from "./schema";

async function assertClassOwner(classId: string, actor: Actor) {
  const cls = assertExists(
    await db.query.classes.findFirst({
      where: eq(table.classes.id, classId),
    }),
    "Class",
  );
  if (!actor.is(ROLES.ADMIN) && cls.instructorId !== actor.sub) {
    throw new ForbiddenError(
      "Only the class instructor can perform this action",
    );
  }
  return cls;
}

async function assertActiveMember(classId: string, userId: string) {
  return assertExists(
    await db.query.classMembers.findFirst({
      where: and(
        eq(table.classMembers.classId, classId),
        eq(table.classMembers.userId, userId),
        isNull(table.classMembers.removedAt),
      ),
    }),
    "Class member",
  );
}

export async function create(
  classId: string,
  body: CreateFeedbackBody,
  actor: Actor,
) {
  await assertClassOwner(classId, actor);
  await assertActiveMember(classId, body.toUserId);

  if (body.submissionId) {
    const submission = await db.query.submissions.findFirst({
      where: and(
        eq(table.submissions.id, body.submissionId),
        eq(table.submissions.userId, body.toUserId),
      ),
      columns: { id: true },
    });
    if (!submission) {
      throw new BadRequestError(
        "Submission not found or does not belong to this learner",
      );
    }
  }

  return db
    .insert(table.instructorFeedback)
    .values({
      classId,
      fromUserId: actor.sub,
      toUserId: body.toUserId,
      content: body.content,
      skill: body.skill ?? null,
      submissionId: body.submissionId ?? null,
    })
    .returning()
    .then(takeFirstOrThrow);
}

export async function list(
  classId: string,
  query: FeedbackListQuery,
  actor: Actor,
) {
  const conditions = [eq(table.instructorFeedback.classId, classId)];

  const cls = assertExists(
    await db.query.classes.findFirst({
      where: eq(table.classes.id, classId),
      columns: { id: true, instructorId: true },
    }),
    "Class",
  );

  // Learner: must be an active member and can only see their own feedback
  if (!actor.is(ROLES.INSTRUCTOR)) {
    await assertActiveMember(classId, actor.sub);
    conditions.push(eq(table.instructorFeedback.toUserId, actor.sub));
  } else if (!actor.is(ROLES.ADMIN) && cls.instructorId !== actor.sub) {
    throw new ForbiddenError("Only the class instructor can view all feedback");
  }

  if (query.skill) {
    conditions.push(eq(table.instructorFeedback.skill, query.skill));
  }

  const where = and(...conditions);

  return paginate(
    db
      .select()
      .from(table.instructorFeedback)
      .where(where)
      .orderBy(desc(table.instructorFeedback.createdAt))
      .$dynamic(),
    db.$count(table.instructorFeedback, where),
    query,
  );
}
