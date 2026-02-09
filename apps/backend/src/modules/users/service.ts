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
import { db, notDeleted, omitColumns, pagination, table } from "@/db";
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
    assertAccess(userId, actor, "You can only view your own profile");
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
  const pg = pagination(query.page, query.limit);
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

  const [[countResult], users] = await Promise.all([
    db.select({ count: count() }).from(table.users).where(whereClause),
    db
      .select(USER_COLUMNS)
      .from(table.users)
      .where(whereClause)
      .orderBy(table.users.createdAt)
      .limit(pg.limit)
      .offset(pg.offset),
  ]);

  return { data: users, meta: pg.meta(countResult?.count ?? 0) };
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
      throw new ConflictError("Email already registered");
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
  assertAccess(userId, actor, "You can only update your own profile");

  if (body.role && !actor.is("admin")) {
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
      const emailExists = await tx.query.users.findFirst({
        where: and(
          eq(table.users.email, email),
          ne(table.users.id, userId),
          notDeleted(table.users),
        ),
        columns: { id: true },
      });
      if (emailExists) {
        throw new ConflictError("Email already in use");
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
    assertExists(
      await tx.query.users.findFirst({
        where: and(eq(table.users.id, userId), notDeleted(table.users)),
        columns: { id: true },
      }),
      "User",
    );

    const timestamp = now();
    const [user] = await tx
      .update(table.users)
      .set({ deletedAt: timestamp, updatedAt: timestamp })
      .where(eq(table.users.id, userId))
      .returning({ id: table.users.id, deletedAt: table.users.deletedAt });

    const deleted = assertExists(user, "User");
    return { id: deleted.id, deletedAt: deleted.deletedAt ?? timestamp };
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

    const isValid = await verifyPassword(
      body.currentPassword,
      user.passwordHash,
    );
    if (!isValid) {
      throw new UnauthorizedError("Current password is incorrect");
    }

    const newPasswordHash = await hashPassword(body.newPassword);
    await tx
      .update(table.users)
      .set({ passwordHash: newPasswordHash, updatedAt: now() })
      .where(eq(table.users.id, userId));

    return { message: "Password updated successfully" };
  });
}
