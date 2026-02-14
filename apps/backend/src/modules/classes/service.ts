import type { Actor } from "@common/auth-types";
import { ROLES } from "@common/auth-types";
import { BadRequestError, ConflictError, ForbiddenError } from "@common/errors";
import { assertExists, generateInviteCode } from "@common/utils";
import { SKILLS } from "@db/enums";
import { db, paginate, table } from "@db/index";
import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import {
  getAtRiskLearners,
  getProgressForUsers,
} from "@/modules/progress/service";
import type {
  ClassListQuery,
  CreateClassBody,
  CreateFeedbackBody,
  FeedbackListQuery,
  UpdateClassBody,
} from "./schema";

// ── Helpers ────────────────────────────────────────────────

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

// ── Class CRUD ─────────────────────────────────────────────

export async function createClass(body: CreateClassBody, actor: Actor) {
  const inviteCode = generateInviteCode();
  const [created] = await db
    .insert(table.classes)
    .values({
      name: body.name,
      description: body.description ?? null,
      instructorId: actor.sub,
      inviteCode,
    })
    .returning();

  return assertExists(created, "Class");
}

export async function listClasses(query: ClassListQuery, actor: Actor) {
  const memberCountSq = db
    .select({ count: sql<number>`count(*)::int`.as("member_count") })
    .from(table.classMembers)
    .where(
      and(
        eq(table.classMembers.classId, table.classes.id),
        isNull(table.classMembers.removedAt),
      ),
    );

  const selectColumns = {
    id: table.classes.id,
    name: table.classes.name,
    description: table.classes.description,
    instructorId: table.classes.instructorId,
    inviteCode: table.classes.inviteCode,
    createdAt: table.classes.createdAt,
    updatedAt: table.classes.updatedAt,
    memberCount: memberCountSq.as("memberCount"),
  };

  if (actor.is(ROLES.ADMIN)) {
    return paginate(
      db
        .select(selectColumns)
        .from(table.classes)
        .orderBy(desc(table.classes.createdAt))
        .$dynamic(),
      db.$count(table.classes),
      query,
    );
  }

  if (actor.is(ROLES.INSTRUCTOR)) {
    const where = eq(table.classes.instructorId, actor.sub);
    return paginate(
      db
        .select(selectColumns)
        .from(table.classes)
        .where(where)
        .orderBy(desc(table.classes.createdAt))
        .$dynamic(),
      db.$count(table.classes, where),
      query,
    );
  }

  // Learner: classes they are a member of
  const where = and(
    eq(table.classMembers.userId, actor.sub),
    isNull(table.classMembers.removedAt),
  );

  return paginate(
    db
      .select(selectColumns)
      .from(table.classes)
      .innerJoin(
        table.classMembers,
        eq(table.classMembers.classId, table.classes.id),
      )
      .where(where)
      .orderBy(desc(table.classes.createdAt))
      .$dynamic(),
    db
      .select({ count: count() })
      .from(table.classes)
      .innerJoin(
        table.classMembers,
        eq(table.classMembers.classId, table.classes.id),
      )
      .where(where)
      .then((r) => r[0]?.count ?? 0),
    query,
  );
}

export async function getClassById(classId: string, actor: Actor) {
  const cls = assertExists(
    await db.query.classes.findFirst({
      where: eq(table.classes.id, classId),
    }),
    "Class",
  );

  // Authorization: admin, owner, or active member
  if (!actor.is(ROLES.ADMIN) && cls.instructorId !== actor.sub) {
    const membership = await db.query.classMembers.findFirst({
      where: and(
        eq(table.classMembers.classId, classId),
        eq(table.classMembers.userId, actor.sub),
        isNull(table.classMembers.removedAt),
      ),
    });
    if (!membership) {
      throw new ForbiddenError("You do not have access to this class");
    }
  }

  const members = await db
    .select({
      id: table.classMembers.id,
      userId: table.classMembers.userId,
      fullName: table.users.fullName,
      email: table.users.email,
      joinedAt: table.classMembers.joinedAt,
    })
    .from(table.classMembers)
    .innerJoin(table.users, eq(table.users.id, table.classMembers.userId))
    .where(
      and(
        eq(table.classMembers.classId, classId),
        isNull(table.classMembers.removedAt),
      ),
    );

  const result = { ...cls, members, memberCount: members.length };

  // Hide invite code from non-owners (learners)
  if (cls.instructorId !== actor.sub && !actor.is(ROLES.ADMIN)) {
    return { ...result, inviteCode: null };
  }

  return result;
}

export async function updateClass(
  classId: string,
  body: UpdateClassBody,
  actor: Actor,
) {
  await assertClassOwner(classId, actor);

  const [updated] = await db
    .update(table.classes)
    .set({
      ...body,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(table.classes.id, classId))
    .returning();

  return assertExists(updated, "Class");
}

export async function removeClass(classId: string, actor: Actor) {
  await assertClassOwner(classId, actor);

  const [deleted] = await db
    .delete(table.classes)
    .where(eq(table.classes.id, classId))
    .returning({ id: table.classes.id });

  return assertExists(deleted, "Class");
}

export async function rotateInviteCode(classId: string, actor: Actor) {
  await assertClassOwner(classId, actor);

  const newCode = generateInviteCode();
  const [updated] = await db
    .update(table.classes)
    .set({ inviteCode: newCode, updatedAt: new Date().toISOString() })
    .where(eq(table.classes.id, classId))
    .returning();

  return assertExists(updated, "Class");
}

// ── Join / Leave ───────────────────────────────────────────

export async function joinClass(body: { inviteCode: string }, actor: Actor) {
  return db.transaction(async (tx) => {
    const cls = assertExists(
      await tx.query.classes.findFirst({
        where: eq(table.classes.inviteCode, body.inviteCode),
      }),
      "Invalid invite code",
    );

    // Check existing membership (including removed)
    const existing = await tx.query.classMembers.findFirst({
      where: and(
        eq(table.classMembers.classId, cls.id),
        eq(table.classMembers.userId, actor.sub),
      ),
    });

    if (existing && !existing.removedAt) {
      throw new ConflictError("Already a member of this class");
    }

    if (existing?.removedAt) {
      // Re-join: clear removedAt + update joinedAt
      await tx
        .update(table.classMembers)
        .set({ removedAt: null, joinedAt: new Date().toISOString() })
        .where(eq(table.classMembers.id, existing.id));
    } else {
      // New join: use onConflictDoNothing to handle race condition
      const [inserted] = await tx
        .insert(table.classMembers)
        .values({ classId: cls.id, userId: actor.sub })
        .onConflictDoNothing({
          target: [table.classMembers.classId, table.classMembers.userId],
        })
        .returning();

      // If nothing inserted, another concurrent request already joined
      if (!inserted) {
        throw new ConflictError("Already a member of this class");
      }
    }

    return { classId: cls.id, className: cls.name };
  });
}

export async function leaveClass(classId: string, actor: Actor) {
  const cls = assertExists(
    await db.query.classes.findFirst({
      where: eq(table.classes.id, classId),
      columns: { instructorId: true },
    }),
    "Class",
  );

  if (cls.instructorId === actor.sub) {
    throw new BadRequestError("Class instructor cannot leave their own class");
  }

  const membership = assertExists(
    await db.query.classMembers.findFirst({
      where: and(
        eq(table.classMembers.classId, classId),
        eq(table.classMembers.userId, actor.sub),
        isNull(table.classMembers.removedAt),
      ),
    }),
    "Not a member of this class",
  );

  const ts = new Date().toISOString();
  await db
    .update(table.classMembers)
    .set({ removedAt: ts })
    .where(eq(table.classMembers.id, membership.id));

  return { id: membership.id, removedAt: ts };
}

export async function removeMember(
  classId: string,
  userId: string,
  actor: Actor,
) {
  await assertClassOwner(classId, actor);

  const membership = assertExists(
    await db.query.classMembers.findFirst({
      where: and(
        eq(table.classMembers.classId, classId),
        eq(table.classMembers.userId, userId),
        isNull(table.classMembers.removedAt),
      ),
    }),
    "Class member",
  );

  const ts = new Date().toISOString();
  await db
    .update(table.classMembers)
    .set({ removedAt: ts })
    .where(eq(table.classMembers.id, membership.id));

  return { id: membership.id, removedAt: ts };
}

// ── Dashboard ──────────────────────────────────────────────

export async function getDashboard(classId: string, actor: Actor) {
  await assertClassOwner(classId, actor);

  const members = await db
    .select({
      userId: table.classMembers.userId,
      fullName: table.users.fullName,
      email: table.users.email,
    })
    .from(table.classMembers)
    .innerJoin(table.users, eq(table.users.id, table.classMembers.userId))
    .where(
      and(
        eq(table.classMembers.classId, classId),
        isNull(table.classMembers.removedAt),
      ),
    );

  const userIds = members.map((m) => m.userId);
  const [progressData, atRiskData] = await Promise.all([
    getProgressForUsers(userIds),
    getAtRiskLearners(userIds),
  ]);

  const skillSummary = Object.fromEntries(
    SKILLS.map((skill) => {
      const avgs: number[] = [];
      const trendCounts = { improving: 0, stable: 0, declining: 0 };

      for (const p of progressData) {
        const s = p.skills[skill];
        if (s?.avg !== null && s?.avg !== undefined) avgs.push(s.avg);
        if (s?.trend && s.trend in trendCounts) {
          trendCounts[s.trend as keyof typeof trendCounts]++;
        }
      }

      const avgScore =
        avgs.length > 0
          ? Math.round((avgs.reduce((a, b) => a + b, 0) / avgs.length) * 10) /
            10
          : null;

      return [skill, { avgScore, trendDistribution: trendCounts }];
    }),
  );

  const atRiskLearners = atRiskData
    .filter((r) => r.atRisk)
    .map((r) => {
      const member = members.find((m) => m.userId === r.userId);
      return {
        userId: r.userId,
        fullName: member?.fullName ?? null,
        email: member?.email ?? "",
        reasons: r.reasons,
      };
    });

  return {
    memberCount: userIds.length,
    atRiskCount: atRiskLearners.length,
    atRiskLearners,
    skillSummary,
  };
}

export async function getMemberProgress(
  classId: string,
  userId: string,
  actor: Actor,
) {
  await assertClassOwner(classId, actor);
  await assertActiveMember(classId, userId);

  const [result] = await getProgressForUsers([userId]);
  return result ?? null;
}

// ── Feedback ───────────────────────────────────────────────

export async function createFeedback(
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

  const [feedback] = await db
    .insert(table.instructorFeedback)
    .values({
      classId,
      fromUserId: actor.sub,
      toUserId: body.toUserId,
      content: body.content,
      skill: body.skill ?? null,
      submissionId: body.submissionId ?? null,
    })
    .returning();

  return assertExists(feedback, "Feedback");
}

export async function listFeedback(
  classId: string,
  query: FeedbackListQuery,
  actor: Actor,
) {
  const conditions = [eq(table.instructorFeedback.classId, classId)];

  // Verify class exists
  const cls = assertExists(
    await db.query.classes.findFirst({
      where: eq(table.classes.id, classId),
      columns: { id: true, instructorId: true },
    }),
    "Class",
  );

  // Learner can only see their own feedback
  if (!actor.is(ROLES.INSTRUCTOR)) {
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
