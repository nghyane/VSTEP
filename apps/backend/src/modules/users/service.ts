import { USER_MESSAGES } from "@common/messages";
import { hashPassword, verifyPassword } from "@common/password";
import {
  assertAccess,
  assertExists,
  escapeLike,
  normalizeEmail,
  now,
} from "@common/utils";
import {
  and,
  count,
  eq,
  getTableColumns,
  ilike,
  ne,
  type SQL,
} from "drizzle-orm";
import {
  db,
  notDeleted,
  omitColumns,
  paginatedList,
  softDelete,
  table,
} from "@/db";
import type { Actor } from "@/plugins/auth";
import {
  ConflictError,
  ForbiddenError,
  isUniqueViolation,
  UnauthorizedError,
} from "@/plugins/error";
import type {
  UserCreateBody,
  UserListQuery,
  UserPasswordBody,
  UserUpdateBody,
} from "./model";

// ── Column sets ─────────────────────────────────────────────────────

const USER_COLUMNS = omitColumns(getTableColumns(table.users), [
  "passwordHash",
  "deletedAt",
]);

// ── Public API ──────────────────────────────────────────────────────

export async function getUserById(userId: string, actor?: Actor) {
  if (actor) {
    assertAccess(userId, actor, USER_MESSAGES.viewOwnProfile);
  }

  const user = await db.query.users.findFirst({
    where: and(eq(table.users.id, userId), notDeleted(table.users)),
    columns: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
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

  return paginatedList({
    page: query.page,
    limit: query.limit,
    getCount: async () => {
      const [result] = await db
        .select({ count: count() })
        .from(table.users)
        .where(whereClause);
      return result?.count ?? 0;
    },
    getData: ({ limit, offset }) =>
      db
        .select(USER_COLUMNS)
        .from(table.users)
        .where(whereClause)
        .orderBy(table.users.createdAt)
        .limit(limit)
        .offset(offset),
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
        role: body.role ?? "learner",
      })
      .returning(USER_COLUMNS);

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

  if (body.role && !actor.is("admin")) {
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
      .returning(USER_COLUMNS);

    return assertExists(user, "User");
  });
}

export async function removeUser(userId: string) {
  return db.transaction(async (tx) => {
    return softDelete(tx, {
      entityName: "User",
      findExisting: (trx) =>
        trx.query.users.findFirst({
          where: and(eq(table.users.id, userId), notDeleted(table.users)),
          columns: { id: true },
        }),
      runDelete: async (trx, timestamp) => {
        const [user] = await trx
          .update(table.users)
          .set({ deletedAt: timestamp, updatedAt: timestamp })
          .where(eq(table.users.id, userId))
          .returning({ id: table.users.id, deletedAt: table.users.deletedAt });
        return user;
      },
    });
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
