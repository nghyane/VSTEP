import { hashPassword, verifyPassword } from "@common/password";
import { assertAccess, assertExists, escapeLike, now } from "@common/utils";
import { and, count, eq, ilike, ne, type SQL } from "drizzle-orm";
import { db, notDeleted, pagination, table } from "@/db";
import type { Actor } from "@/plugins/auth";
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
} from "@/plugins/error";

const USER_COLUMNS = {
  id: table.users.id,
  email: table.users.email,
  fullName: table.users.fullName,
  role: table.users.role,
  createdAt: table.users.createdAt,
  updatedAt: table.users.updatedAt,
} as const;

export async function getUserById(userId: string) {
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

export async function listUsers(query: {
  page?: number;
  limit?: number;
  role?: "learner" | "instructor" | "admin";
  search?: string;
}) {
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

  const [countResult] = await db
    .select({ count: count() })
    .from(table.users)
    .where(whereClause);

  const total = countResult?.count ?? 0;

  const users = await db
    .select(USER_COLUMNS)
    .from(table.users)
    .where(whereClause)
    .orderBy(table.users.createdAt)
    .limit(pg.limit)
    .offset(pg.offset);

  return {
    data: users,
    meta: pg.meta(total),
  };
}

export async function createUser(body: {
  email: string;
  password: string;
  fullName?: string;
  role?: "learner" | "instructor" | "admin";
}) {
  const passwordHash = await hashPassword(body.password);

  try {
    const [user] = await db
      .insert(table.users)
      .values({
        email: body.email,
        passwordHash,
        fullName: body.fullName,
        role: body.role ?? "learner",
      })
      .returning(USER_COLUMNS);

    return assertExists(user, "User");
  } catch (err: unknown) {
    if (
      err instanceof Error &&
      "code" in err &&
      (err as { code: string }).code === "23505"
    ) {
      throw new ConflictError("Email already registered");
    }
    throw err;
  }
}

export async function updateUser(
  userId: string,
  body: {
    email?: string;
    fullName?: string | null;
    role?: "learner" | "instructor" | "admin";
  },
  actor: Actor,
) {
  assertAccess(userId, actor, "You can only update your own profile");

  if (body.role && !actor.is("admin")) {
    throw new ForbiddenError("Only admins can change user roles");
  }

  return db.transaction(async (tx) => {
    const [existingUser] = await tx
      .select({ id: table.users.id })
      .from(table.users)
      .where(and(eq(table.users.id, userId), notDeleted(table.users)))
      .limit(1);

    assertExists(existingUser, "User");

    if (body.email) {
      const [emailExists] = await tx
        .select({ id: table.users.id })
        .from(table.users)
        .where(
          and(
            eq(table.users.email, body.email),
            ne(table.users.id, userId),
            notDeleted(table.users),
          ),
        )
        .limit(1);

      if (emailExists) {
        throw new ConflictError("Email already in use");
      }
    }

    const updateValues: Partial<typeof table.users.$inferInsert> = {
      updatedAt: now(),
    };

    if (body.email) updateValues.email = body.email;
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
    const [existingUser] = await tx
      .select({ id: table.users.id })
      .from(table.users)
      .where(and(eq(table.users.id, userId), notDeleted(table.users)))
      .limit(1);

    assertExists(existingUser, "User");

    const timestamp = now();
    const [user] = await tx
      .update(table.users)
      .set({
        deletedAt: timestamp,
        updatedAt: timestamp,
      })
      .where(eq(table.users.id, userId))
      .returning({
        id: table.users.id,
        deletedAt: table.users.deletedAt,
      });

    const deletedUser = assertExists(user, "User");

    return {
      id: deletedUser.id,
      deletedAt: deletedUser.deletedAt!,
    };
  });
}

export async function updateUserPassword(
  userId: string,
  body: { currentPassword: string; newPassword: string },
  actor: Actor,
) {
  assertAccess(userId, actor, "You can only change your own password");

  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        id: table.users.id,
        passwordHash: table.users.passwordHash,
      })
      .from(table.users)
      .where(and(eq(table.users.id, userId), notDeleted(table.users)))
      .limit(1);

    const user = assertExists(row, "User");

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
      .set({
        passwordHash: newPasswordHash,
        updatedAt: now(),
      })
      .where(eq(table.users.id, userId));

    return { message: "Password updated successfully" };
  });
}
