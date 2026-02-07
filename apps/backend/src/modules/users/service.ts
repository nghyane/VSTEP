import {
  assertExists,
  assertOwnerOrAdmin,
  escapeLike,
  now,
} from "@common/utils";
import { and, count, eq, ilike, ne, type SQL } from "drizzle-orm";
import { db, notDeleted, pagination, table } from "@/db";
import { AuthService } from "@/modules/auth/service";
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

export class UserService {
  static async getById(userId: string) {
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

  static async list(query: {
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

  static async create(body: {
    email: string;
    password: string;
    fullName?: string;
    role?: "learner" | "instructor" | "admin";
  }) {
    const existingUser = await db.query.users.findFirst({
      where: and(eq(table.users.email, body.email), notDeleted(table.users)),
      columns: { id: true },
    });

    if (existingUser) {
      throw new ConflictError("Email already registered");
    }

    const passwordHash = await AuthService.hashPassword(body.password);

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
  }

  static async update(
    userId: string,
    body: {
      email?: string;
      fullName?: string | null;
      role?: "learner" | "instructor" | "admin";
    },
    currentUserId: string,
    isAdmin: boolean,
  ) {
    assertOwnerOrAdmin(
      userId,
      currentUserId,
      isAdmin,
      "You can only update your own profile",
    );

    if (body.role && !isAdmin) {
      throw new ForbiddenError("Only admins can change user roles");
    }

    return await db.transaction(async (tx) => {
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

  static async remove(userId: string) {
    return await db.transaction(async (tx) => {
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

  static async updatePassword(
    userId: string,
    body: { currentPassword: string; newPassword: string },
    currentUserId: string,
    isAdmin: boolean,
  ) {
    assertOwnerOrAdmin(
      userId,
      currentUserId,
      isAdmin,
      "You can only change your own password",
    );

    const user = assertExists(
      await db.query.users.findFirst({
        where: and(eq(table.users.id, userId), notDeleted(table.users)),
        columns: {
          id: true,
          passwordHash: true,
        },
      }),
      "User",
    );

    const isValid = await AuthService.verifyPassword(
      body.currentPassword,
      user.passwordHash,
    );

    if (!isValid) {
      throw new UnauthorizedError("Current password is incorrect");
    }

    const newPasswordHash = await AuthService.hashPassword(body.newPassword);

    await db
      .update(table.users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: now(),
      })
      .where(eq(table.users.id, userId));

    return { message: "Password updated successfully" };
  }
}
