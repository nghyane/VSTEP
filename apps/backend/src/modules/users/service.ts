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
import { db, notDeleted, paginated, table } from "@db/index";
import { and, count, eq, ilike, ne, type SQL } from "drizzle-orm";
import type {
  UserCreateBody,
  UserListQuery,
  UserPasswordBody,
  UserUpdateBody,
} from "./schema";
import { USER_COLUMNS } from "./schema";

export async function getUserById(userId: string, actor?: Actor) {
  if (actor) assertAccess(userId, actor, "You can only view your own profile");

  const user = await db.query.users.findFirst({
    where: and(eq(table.users.id, userId), notDeleted(table.users)),
    columns: { passwordHash: false, deletedAt: false },
  });

  return assertExists(user, "User");
}

export async function listUsers(query: UserListQuery) {
  const where = and(
    ...[
      notDeleted(table.users),
      query.role && eq(table.users.role, query.role),
      query.search &&
        ilike(table.users.fullName, `%${escapeLike(query.search)}%`),
    ].filter((c): c is SQL => Boolean(c)),
  );

  const pg = paginated(query.page, query.limit);
  return pg.resolve({
    count: db
      .select({ count: count() })
      .from(table.users)
      .where(where)
      .then((r) => r[0]?.count ?? 0),
    query: db
      .select(USER_COLUMNS)
      .from(table.users)
      .where(where)
      .orderBy(table.users.createdAt)
      .limit(pg.limit)
      .offset(pg.offset),
  });
}

export async function createUser(body: UserCreateBody) {
  const email = normalizeEmail(body.email);
  const hash = await Bun.password.hash(body.password, "argon2id");

  const [user] = await db
    .insert(table.users)
    .values({
      email,
      passwordHash: hash,
      fullName: body.fullName,
      role: body.role ?? ROLES.LEARNER,
    })
    .onConflictDoNothing()
    .returning(USER_COLUMNS);

  if (!user) throw new ConflictError("Email already registered");
  return user;
}

export async function updateUser(
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
        where: and(eq(table.users.id, userId), notDeleted(table.users)),
        columns: { id: true },
      }),
      "User",
    );

    if (email) {
      const exists = await tx.query.users.findFirst({
        where: and(
          eq(table.users.email, email),
          ne(table.users.id, userId),
          notDeleted(table.users),
        ),
        columns: { id: true },
      });
      if (exists) throw new ConflictError("Email already in use");
    }

    const [user] = await tx
      .update(table.users)
      .set({
        updatedAt: new Date().toISOString(),
        ...(email && { email }),
        ...(body.fullName !== undefined && { fullName: body.fullName }),
        ...(body.role && { role: body.role }),
      })
      .where(eq(table.users.id, userId))
      .returning(USER_COLUMNS);

    return assertExists(user, "User");
  });
}

export async function removeUser(userId: string) {
  return db.transaction(async (tx) => {
    assertExists(
      await tx.query.users.findFirst({
        where: and(eq(table.users.id, userId), notDeleted(table.users)),
        columns: { id: true },
      }),
      "User",
    );

    const ts = new Date().toISOString();
    const [deleted] = await tx
      .update(table.users)
      .set({ deletedAt: ts, updatedAt: ts })
      .where(eq(table.users.id, userId))
      .returning({ id: table.users.id, deletedAt: table.users.deletedAt });

    const user = assertExists(deleted, "User");
    return { id: user.id, deletedAt: user.deletedAt ?? ts };
  });
}

export async function updateUserPassword(
  userId: string,
  body: UserPasswordBody,
  actor: Actor,
) {
  assertAccess(userId, actor, "You can only change your own password");

  return db.transaction(async (tx) => {
    const user = assertExists(
      await tx.query.users.findFirst({
        where: and(eq(table.users.id, userId), notDeleted(table.users)),
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
