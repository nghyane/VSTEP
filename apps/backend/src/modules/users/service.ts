import type { Actor } from "@common/auth-types";
import { ROLES } from "@common/auth-types";
import {
  ConflictError,
  ForbiddenError,
  isUniqueViolation,
  UnauthorizedError,
} from "@common/errors";
import { hashPassword, verifyPassword } from "@common/password";
import {
  assertAccess,
  assertExists,
  escapeLike,
  normalizeEmail,
  now,
} from "@common/utils";
import { db, notDeleted, table } from "@db/index";
import { paginatedQuery } from "@db/repos";
import { userView } from "@db/views";
import { and, count, eq, ilike, ne, type SQL } from "drizzle-orm";
import { USER_MESSAGES } from "./messages";
import type {
  UserCreateBody,
  UserListQuery,
  UserPasswordBody,
  UserUpdateBody,
} from "./schema";

export async function getUserById(userId: string, actor?: Actor) {
  if (actor) {
    assertAccess(userId, actor, USER_MESSAGES.viewOwnProfile);
  }

  const user = await db.query.users.findFirst({
    where: and(eq(table.users.id, userId), notDeleted(table.users)),
    columns: userView.queryColumns,
  });

  return assertExists(user, "User");
}

export async function listUsers(query: UserListQuery) {
  const conditions: SQL[] = [notDeleted(table.users)];

  if (query.role) {
    conditions.push(eq(table.users.role, query.role));
  }
  if (query.search) {
    conditions.push(
      ilike(table.users.fullName, `%${escapeLike(query.search)}%`),
    );
  }

  const whereClause = and(...conditions);

  const pg = paginatedQuery(query.page, query.limit);
  return pg.resolve({
    count: db
      .select({ count: count() })
      .from(table.users)
      .where(whereClause)
      .then((result) => result[0]?.count ?? 0),
    query: db
      .select(userView.columns)
      .from(table.users)
      .where(whereClause)
      .orderBy(table.users.createdAt)
      .limit(pg.limit)
      .offset(pg.offset),
  });
}

export async function createUser(body: UserCreateBody) {
  const email = normalizeEmail(body.email);
  const passwordHash = await hashPassword(body.password);

  try {
    const [user] = await db
      .insert(table.users)
      .values({
        email,
        passwordHash,
        fullName: body.fullName,
        role: body.role ?? ROLES.LEARNER,
      })
      .returning(userView.columns);

    return assertExists(user, "User");
  } catch (err: unknown) {
    if (isUniqueViolation(err)) {
      throw new ConflictError(USER_MESSAGES.emailAlreadyRegistered);
    }
    throw err;
  }
}

export async function updateUser(
  userId: string,
  body: UserUpdateBody,
  actor: Actor,
) {
  const email = body.email ? normalizeEmail(body.email) : undefined;
  assertAccess(userId, actor, USER_MESSAGES.updateOwnProfile);

  if (body.role && !actor.is(ROLES.ADMIN)) {
    throw new ForbiddenError(USER_MESSAGES.adminRoleOnly);
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
      const emailExists = await tx.query.users.findFirst({
        where: and(
          eq(table.users.email, email),
          ne(table.users.id, userId),
          notDeleted(table.users),
        ),
        columns: { id: true },
      });
      if (emailExists) {
        throw new ConflictError(USER_MESSAGES.emailInUse);
      }
    }

    const updateValues: Partial<typeof table.users.$inferInsert> = {
      updatedAt: now(),
    };
    if (email) updateValues.email = email;
    if (body.fullName !== undefined) updateValues.fullName = body.fullName;
    if (body.role) updateValues.role = body.role;

    const [user] = await tx
      .update(table.users)
      .set(updateValues)
      .where(eq(table.users.id, userId))
      .returning(userView.columns);

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

    const timestamp = now();
    const [deleted] = await tx
      .update(table.users)
      .set({ deletedAt: timestamp, updatedAt: timestamp })
      .where(eq(table.users.id, userId))
      .returning({ id: table.users.id, deletedAt: table.users.deletedAt });

    const user = assertExists(deleted, "User");
    return { id: user.id, deletedAt: user.deletedAt ?? timestamp };
  });
}

export async function updateUserPassword(
  userId: string,
  body: UserPasswordBody,
  actor: Actor,
) {
  assertAccess(userId, actor, USER_MESSAGES.changeOwnPassword);

  return db.transaction(async (tx) => {
    const user = assertExists(
      await tx.query.users.findFirst({
        where: and(eq(table.users.id, userId), notDeleted(table.users)),
        columns: { id: true, passwordHash: true },
      }),
      "User",
    );

    const isValid = await verifyPassword(
      body.currentPassword,
      user.passwordHash,
    );
    if (!isValid) {
      throw new UnauthorizedError(USER_MESSAGES.incorrectPassword);
    }

    const newPasswordHash = await hashPassword(body.newPassword);
    await tx
      .update(table.users)
      .set({ passwordHash: newPasswordHash, updatedAt: now() })
      .where(eq(table.users.id, userId));

    return { message: "Password updated successfully" };
  });
}
