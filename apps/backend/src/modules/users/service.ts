/**
 * Users Module Service
 * Business logic for user management
 * Pattern: Abstract class with static methods (no instantiation)
 * @see https://elysiajs.com/pattern/mvc.html
 */

import { assertExists } from "@common/utils";
import { and, count, eq, ilike, sql } from "drizzle-orm";
import { db, notDeleted, paginate, paginationMeta, table } from "@/db";
import { AuthService } from "@/modules/auth/service";
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  UnauthorizedError,
} from "@/plugins/error";

/**
 * Mapper function for consistent user response serialization
 */
const mapUserResponse = (user: {
  id: string;
  email: string;
  fullName: string | null;
  role: "learner" | "instructor" | "admin";
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: user.id,
  email: user.email,
  fullName: user.fullName,
  role: user.role,
  createdAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

/**
 * User Service - Abstract class with static methods
 * No instantiation needed - all methods are static
 */
export abstract class UserService {
  /**
   * Get user by ID (excluding soft-deleted)
   * @throws NotFoundError if user not found
   */
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

    if (!user) {
      throw new NotFoundError("User not found");
    }

    return mapUserResponse(user);
  }

  /**
   * Get user by email
   */
  static async getByEmail(email: string) {
    const user = await db.query.users.findFirst({
      where: and(eq(table.users.email, email), notDeleted(table.users)),
      columns: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return null;
    }

    return mapUserResponse(user);
  }

  /**
   * List users with pagination and filtering
   */
  static async list(query: {
    page?: number;
    limit?: number;
    role?: "learner" | "instructor" | "admin";
    search?: string;
  }) {
    const page = query.page || 1;
    const limit = query.limit || 20;

    // Build where conditions
    const conditions: ReturnType<typeof and>[] = [notDeleted(table.users)];

    if (query.role) {
      conditions.push(eq(table.users.role, query.role));
    }

    if (query.search) {
      conditions.push(ilike(table.users.fullName, `%${query.search}%`));
    }

    const whereClause =
      conditions.length > 1 ? and(...conditions) : conditions[0];

    // Get total count
    const [countResult] = await db
      .select({ count: count() })
      .from(table.users)
      .where(whereClause);

    const total = countResult?.count || 0;

    const { limit: take, offset } = paginate(page, limit);

    // Get users
    const users = await db
      .select({
        id: table.users.id,
        email: table.users.email,
        fullName: table.users.fullName,
        role: table.users.role,
        createdAt: table.users.createdAt,
        updatedAt: table.users.updatedAt,
      })
      .from(table.users)
      .where(whereClause)
      .orderBy(table.users.createdAt)
      .limit(take)
      .offset(offset);

    return {
      data: users.map(mapUserResponse),
      meta: paginationMeta(total, page, limit),
    };
  }

  /**
   * Create new user
   * @throws ConflictError if email already exists
   */
  static async create(body: {
    email: string;
    password: string;
    fullName?: string;
    role?: "learner" | "instructor" | "admin";
  }) {
    // Check for existing active user (soft-deleted emails are reusable)
    const existingUser = await db.query.users.findFirst({
      where: and(eq(table.users.email, body.email), notDeleted(table.users)),
      columns: { id: true },
    });

    if (existingUser) {
      throw new ConflictError("Email already registered");
    }

    // Hash password
    const passwordHash = await AuthService.hashPassword(body.password);

    // Create user
    const [user] = await db
      .insert(table.users)
      .values({
        email: body.email,
        passwordHash,
        fullName: body.fullName,
        role: body.role || "learner",
      })
      .returning({
        id: table.users.id,
        email: table.users.email,
        fullName: table.users.fullName,
        role: table.users.role,
        createdAt: table.users.createdAt,
        updatedAt: table.users.updatedAt,
      });

    const createdUser = assertExists(user, "User");

    return mapUserResponse(createdUser);
  }

  /**
   * Update user
   * @throws NotFoundError if user not found
   * @throws ConflictError if email already exists
   */
  static async update(
    userId: string,
    body: {
      email?: string;
      fullName?: string | null;
      role?: "learner" | "instructor" | "admin";
      password?: string;
    },
    currentUserId: string,
    isAdmin: boolean,
  ) {
    // Only admins can update other users
    if (userId !== currentUserId && !isAdmin) {
      throw new ForbiddenError("You can only update your own profile");
    }

    // Only admins can change roles
    if (body.role && !isAdmin) {
      throw new ForbiddenError("Only admins can change user roles");
    }

    return await db.transaction(async (tx) => {
      // Check user exists
      const [existingUser] = await tx
        .select({ id: table.users.id })
        .from(table.users)
        .where(and(eq(table.users.id, userId), notDeleted(table.users)))
        .limit(1);

      if (!existingUser) {
        throw new NotFoundError("User not found");
      }

      // Check email uniqueness if updating email (exclude soft-deleted)
      if (body.email) {
        const [emailExists] = await tx
          .select({ id: table.users.id })
          .from(table.users)
          .where(
            and(
              eq(table.users.email, body.email),
              sql`${table.users.id} != ${userId}`,
              sql`${table.users.deletedAt} IS NULL`,
            ),
          )
          .limit(1);

        if (emailExists) {
          throw new ConflictError("Email already in use");
        }
      }

      // Build update values
      const updateValues: Partial<{
        email: string;
        fullName: string | undefined | null;
        role: "learner" | "instructor" | "admin";
        passwordHash: string;
        updatedAt: Date;
      }> = {
        updatedAt: new Date(),
      };

      if (body.email) updateValues.email = body.email;
      if (body.fullName !== undefined) updateValues.fullName = body.fullName;
      if (body.role) updateValues.role = body.role;
      if (body.password) {
        updateValues.passwordHash = await AuthService.hashPassword(
          body.password,
        );
      }

      // Update user
      const [user] = await tx
        .update(table.users)
        .set(updateValues)
        .where(eq(table.users.id, userId))
        .returning({
          id: table.users.id,
          email: table.users.email,
          fullName: table.users.fullName,
          role: table.users.role,
          createdAt: table.users.createdAt,
          updatedAt: table.users.updatedAt,
        });

      const updatedUser = assertExists(user, "User");

      return mapUserResponse(updatedUser);
    });
  }

  /**
   * Soft delete user
   * @throws NotFoundError if user not found
   */
  static async remove(userId: string) {
    return await db.transaction(async (tx) => {
      // Check user exists
      const [existingUser] = await tx
        .select({ id: table.users.id })
        .from(table.users)
        .where(and(eq(table.users.id, userId), notDeleted(table.users)))
        .limit(1);

      if (!existingUser) {
        throw new NotFoundError("User not found");
      }

      // Soft delete
      const [user] = await tx
        .update(table.users)
        .set({
          deletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(table.users.id, userId))
        .returning({
          id: table.users.id,
          deletedAt: table.users.deletedAt,
        });

      const deletedUser = assertExists(user, "User");

      return {
        id: deletedUser.id,
        deletedAt: (deletedUser.deletedAt as Date).toISOString(),
      };
    });
  }

  /**
   * Update user password
   * @throws NotFoundError if user not found
   * @throws UnauthorizedError if current password is incorrect
   */
  static async updatePassword(
    userId: string,
    body: { currentPassword: string; newPassword: string },
    currentUserId: string,
    isAdmin: boolean,
  ) {
    if (userId !== currentUserId && !isAdmin) {
      throw new ForbiddenError("You can only change your own password");
    }

    // Get user with password
    const user = await db.query.users.findFirst({
      where: and(eq(table.users.id, userId), notDeleted(table.users)),
      columns: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Verify current password
    const isValid = await AuthService.verifyPassword(
      body.currentPassword,
      user.passwordHash,
    );

    if (!isValid) {
      throw new UnauthorizedError("Current password is incorrect");
    }

    // Hash and update new password
    const newPasswordHash = await AuthService.hashPassword(body.newPassword);

    await db
      .update(table.users)
      .set({
        passwordHash: newPasswordHash,
        updatedAt: new Date(),
      })
      .where(eq(table.users.id, userId));

    return { message: "Password updated successfully" };
  }
}
