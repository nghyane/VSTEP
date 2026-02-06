/**
 * Auth Module Service
 * Business logic for authentication — no JWT signing (handled by controller via @elysiajs/jwt)
 * @see https://elysiajs.com/pattern/mvc.html
 */

import { env } from "@common/env";
import { assertExists } from "@common/utils";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, table } from "@/db";
import { ConflictError, UnauthorizedError } from "@/plugins/error";

export interface UserInfo {
  id: string;
  email: string;
  fullName: string | null;
  role: "learner" | "instructor" | "admin";
}

/** SHA-256 hash for refresh token storage */
function hashToken(token: string): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(token);
  return hasher.digest("hex");
}

/** Parse duration string (e.g. "15m", "7d") to seconds */
export function parseExpiry(str: string): number {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) return 900;
  const n = Number.parseInt(match[1], 10);
  switch (match[2]) {
    case "s":
      return n;
    case "m":
      return n * 60;
    case "h":
      return n * 3600;
    case "d":
      return n * 86400;
    default:
      return 900;
  }
}

/**
 * Auth Service — abstract class with static methods
 * Handles DB operations + business logic. JWT signing is in the controller.
 */
export abstract class AuthService {
  static async hashPassword(password: string): Promise<string> {
    return Bun.password.hash(password, {
      algorithm: "argon2id",
      memoryCost: 65536,
      timeCost: 3,
    });
  }

  static async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return Bun.password.verify(password, hash);
  }

  /**
   * Verify credentials and create a refresh token.
   * Returns user info + opaque refresh token for the controller to pair with an access JWT.
   */
  static async login(body: {
    email: string;
    password: string;
  }): Promise<{ user: UserInfo; refreshToken: string }> {
    const user = await db.query.users.findFirst({
      where: and(
        eq(table.users.email, body.email),
        isNull(table.users.deletedAt),
      ),
      columns: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        passwordHash: true,
      },
    });

    if (!user) throw new UnauthorizedError("Invalid email or password");

    const isValid = await AuthService.verifyPassword(
      body.password,
      user.passwordHash,
    );
    if (!isValid) throw new UnauthorizedError("Invalid email or password");

    const refreshToken = Bun.randomUUIDv7();
    const refreshExpirySeconds = parseExpiry(env.JWT_REFRESH_EXPIRES_IN);

    await db.insert(table.refreshTokens).values({
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      jti: Bun.randomUUIDv7(),
      expiresAt: new Date(Date.now() + refreshExpirySeconds * 1000),
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      refreshToken,
    };
  }

  /**
   * Register a new user.
   * @throws ConflictError if email already exists
   */
  static async register(body: {
    email: string;
    password: string;
    fullName?: string;
    role?: "learner" | "instructor" | "admin";
  }): Promise<{ user: UserInfo; message: string }> {
    const existing = await db.query.users.findFirst({
      where: eq(table.users.email, body.email),
      columns: { id: true },
    });
    if (existing) throw new ConflictError("Email already registered");

    const passwordHash = await AuthService.hashPassword(body.password);

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
      });

    return {
      user: assertExists(user, "User"),
      message: "Account created successfully",
    };
  }

  /**
   * Validate + rotate a refresh token.
   * Returns user info + new opaque refresh token for the controller to pair with a new access JWT.
   */
  static async refreshToken(
    refreshToken: string,
  ): Promise<{ user: UserInfo; newRefreshToken: string }> {
    const hash = hashToken(refreshToken);

    const tokenRecord = await db.query.refreshTokens.findFirst({
      where: and(
        eq(table.refreshTokens.tokenHash, hash),
        isNull(table.refreshTokens.revokedAt),
        gt(table.refreshTokens.expiresAt, new Date()),
      ),
      columns: { id: true, userId: true },
    });

    if (!tokenRecord)
      throw new UnauthorizedError("Invalid or expired refresh token");

    const user = await db.query.users.findFirst({
      where: and(
        eq(table.users.id, tokenRecord.userId),
        isNull(table.users.deletedAt),
      ),
      columns: { id: true, email: true, fullName: true, role: true },
    });

    if (!user) throw new UnauthorizedError("Invalid or expired refresh token");

    // Rotate: revoke old, issue new
    const newRefreshToken = Bun.randomUUIDv7();
    const newJti = Bun.randomUUIDv7();
    const refreshExpirySeconds = parseExpiry(env.JWT_REFRESH_EXPIRES_IN);

    await db.transaction(async (tx) => {
      await tx
        .update(table.refreshTokens)
        .set({ revokedAt: new Date(), replacedByJti: newJti })
        .where(eq(table.refreshTokens.id, tokenRecord.id));

      await tx.insert(table.refreshTokens).values({
        userId: user.id,
        tokenHash: hashToken(newRefreshToken),
        jti: newJti,
        expiresAt: new Date(Date.now() + refreshExpirySeconds * 1000),
      });
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      newRefreshToken,
    };
  }

  /**
   * Revoke a refresh token (logout).
   */
  static async logout(refreshToken: string): Promise<{ message: string }> {
    await db
      .update(table.refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(table.refreshTokens.tokenHash, hashToken(refreshToken)));

    return { message: "Logged out successfully" };
  }
}
