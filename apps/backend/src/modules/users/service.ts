import type { Actor } from "@common/auth-types";
import { ROLES } from "@common/auth-types";
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from "@common/errors";
import {
  assertAccess,
  assertExists,
  escapeLike,
  normalizeEmail,
} from "@common/utils";
import { db, paginate, table, takeFirst, takeFirstOrThrow } from "@db/index";
import { and, eq, ilike, ne } from "drizzle-orm";
import type {
  UserCreateBody,
  UserListQuery,
  UserPasswordBody,
  UserUpdateBody,
} from "./schema";
import { USER_COLUMNS } from "./schema";

/** Internal lookup — no auth check. Use byId for route-facing calls. */
export async function find(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(table.users.id, userId),
    columns: { passwordHash: false },
  });

  return assertExists(user, "User");
}

export async function byId(userId: string, actor: Actor) {
  assertAccess(userId, actor, "You can only view your own profile");
  return find(userId);
}

export async function list(query: UserListQuery) {
  const where = and(
    query.role ? eq(table.users.role, query.role) : undefined,
    query.search
      ? ilike(table.users.fullName, `%${escapeLike(query.search)}%`)
      : undefined,
  );

  return paginate(
    db
      .select(USER_COLUMNS)
      .from(table.users)
      .where(where)
      .orderBy(table.users.createdAt)
      .$dynamic(),
    db.$count(table.users, where),
    query,
  );
}

export async function create(body: UserCreateBody) {
  const email = normalizeEmail(body.email);
  const hash = await Bun.password.hash(body.password, "argon2id");

  const user = await db
    .insert(table.users)
    .values({
      email,
      passwordHash: hash,
      fullName: body.fullName,
      role: body.role ?? ROLES.LEARNER,
    })
    .onConflictDoNothing()
    .returning(USER_COLUMNS)
    .then(takeFirst);

  if (!user) throw new ConflictError("Email already registered");
  return user;
}

export async function update(
  userId: string,
  body: UserUpdateBody,
  actor: Actor,
) {
  const email = body.email ? normalizeEmail(body.email) : undefined;
  assertAccess(userId, actor, "You can only update your own profile");

  if (body.role !== undefined && !actor.is(ROLES.ADMIN)) {
    throw new ForbiddenError("Only admins can change user roles");
  }

  return db.transaction(async (tx) => {
    assertExists(
      await tx.query.users.findFirst({
        where: eq(table.users.id, userId),
        columns: { id: true },
      }),
      "User",
    );

    if (email) {
      const exists = await tx.query.users.findFirst({
        where: and(eq(table.users.email, email), ne(table.users.id, userId)),
        columns: { id: true },
      });
      if (exists) throw new ConflictError("Email already in use");
    }

    return tx
      .update(table.users)
      .set({
        updatedAt: new Date().toISOString(),
        ...(email && { email }),
        ...(body.fullName !== undefined && { fullName: body.fullName }),
        ...(body.role !== undefined && { role: body.role }),
      })
      .where(eq(table.users.id, userId))
      .returning(USER_COLUMNS)
      .then(takeFirstOrThrow);
  });
}

export async function remove(userId: string, actor: Actor) {
  if (userId === actor.sub) {
    throw new ForbiddenError("Cannot delete your own account");
  }

  return db.transaction(async (tx) => {
    assertExists(
      await tx.query.users.findFirst({
        where: eq(table.users.id, userId),
        columns: { id: true },
      }),
      "User",
    );

    return tx
      .delete(table.users)
      .where(eq(table.users.id, userId))
      .returning({ id: table.users.id })
      .then(takeFirstOrThrow);
  });
}

export async function updatePassword(
  userId: string,
  body: UserPasswordBody,
  actor: Actor,
) {
  assertAccess(userId, actor, "You can only change your own password");

  return db.transaction(async (tx) => {
    const user = assertExists(
      await tx.query.users.findFirst({
        where: eq(table.users.id, userId),
        columns: { id: true, passwordHash: true },
      }),
      "User",
    );

    if (!(await Bun.password.verify(body.currentPassword, user.passwordHash))) {
      throw new UnauthorizedError("Current password is incorrect");
    }

    await tx
      .update(table.users)
      .set({
        passwordHash: await Bun.password.hash(body.newPassword, "argon2id"),
        updatedAt: new Date().toISOString(),
      })
      .where(eq(table.users.id, userId));

    return { message: "Password updated successfully" };
  });
}
