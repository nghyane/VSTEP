import type { Actor } from "@common/auth-types";
import { ROLES } from "@common/auth-types";
import { ForbiddenError } from "@common/errors";
import { assertExists, generateInviteCode } from "@common/utils";
import { db, paginate, table, takeFirstOrThrow } from "@db/index";
import { and, count, desc, eq, isNull, sql } from "drizzle-orm";
import { assertClassOwner } from "./guards";
import type {
  ClassListQuery,
  CreateClassBody,
  UpdateClassBody,
} from "./schema";

export async function create(body: CreateClassBody, actor: Actor) {
  const inviteCode = generateInviteCode();
  return db
    .insert(table.classes)
    .values({
      name: body.name,
      description: body.description ?? null,
      instructorId: actor.sub,
      inviteCode,
    })
    .returning()
    .then(takeFirstOrThrow);
}

export async function list(query: ClassListQuery, actor: Actor) {
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

export async function find(classId: string, actor: Actor) {
  const cls = assertExists(
    await db.query.classes.findFirst({
      where: eq(table.classes.id, classId),
    }),
    "Class",
  );

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

  const isOwnerOrAdmin =
    actor.is(ROLES.ADMIN) || cls.instructorId === actor.sub;
  const { inviteCode: _, ...classWithoutCode } = cls;
  const displayClass = isOwnerOrAdmin
    ? cls
    : { ...classWithoutCode, inviteCode: null };
  return { ...displayClass, members, memberCount: members.length };
}

export async function update(
  classId: string,
  body: UpdateClassBody,
  actor: Actor,
) {
  await assertClassOwner(classId, actor);

  return db
    .update(table.classes)
    .set({
      ...body,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(table.classes.id, classId))
    .returning()
    .then(takeFirstOrThrow);
}

export async function remove(classId: string, actor: Actor) {
  await assertClassOwner(classId, actor);

  return db
    .delete(table.classes)
    .where(eq(table.classes.id, classId))
    .returning({ id: table.classes.id })
    .then(takeFirstOrThrow);
}

export async function rotateInviteCode(classId: string, actor: Actor) {
  await assertClassOwner(classId, actor);

  const newCode = generateInviteCode();
  return db
    .update(table.classes)
    .set({ inviteCode: newCode, updatedAt: new Date().toISOString() })
    .where(eq(table.classes.id, classId))
    .returning()
    .then(takeFirstOrThrow);
}
