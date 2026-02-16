import type { Actor } from "@common/auth-types";
import { BadRequestError, ConflictError } from "@common/errors";
import { assertExists } from "@common/utils";
import { db, table, takeFirst } from "@db/index";
import { and, eq, isNull } from "drizzle-orm";
import { assertClassOwner } from "./guards";

export async function join(body: { inviteCode: string }, actor: Actor) {
  return db.transaction(async (tx) => {
    const cls = assertExists(
      await tx.query.classes.findFirst({
        where: eq(table.classes.inviteCode, body.inviteCode),
      }),
      "Invalid invite code",
    );

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
      return { classId: cls.id, className: cls.name };
    }
    // New join: use onConflictDoNothing to handle race condition
    const inserted = await tx
      .insert(table.classMembers)
      .values({ classId: cls.id, userId: actor.sub })
      .onConflictDoNothing({
        target: [table.classMembers.classId, table.classMembers.userId],
      })
      .returning()
      .then(takeFirst);
    if (!inserted) {
      throw new ConflictError("Already a member of this class");
    }

    return { classId: cls.id, className: cls.name };
  });
}

export async function leave(classId: string, actor: Actor) {
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

export async function remove(classId: string, userId: string, actor: Actor) {
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
