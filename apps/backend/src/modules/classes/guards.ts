import type { Actor } from "@common/auth-types";
import { ROLES } from "@common/auth-types";
import { ForbiddenError } from "@common/errors";
import { assertExists } from "@common/utils";
import { db, table } from "@db/index";
import { and, eq, isNull } from "drizzle-orm";

export async function assertClassOwner(classId: string, actor: Actor) {
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

export async function assertActiveMember(classId: string, userId: string) {
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
