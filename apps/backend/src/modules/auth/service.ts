import { env } from "@common/env";
import { assertExists } from "@common/utils";
import { and, asc, eq, gt, isNull } from "drizzle-orm";
import { SignJWT } from "jose";
import { db, table } from "@/db";
import type { JWTPayload } from "@/plugins/auth";
import { ConflictError, UnauthorizedError } from "@/plugins/error";

// ── JWT secrets (encoded once at startup) ───────────────────────

const ACCESS_SECRET = new TextEncoder().encode(env.JWT_SECRET!);

const MAX_REFRESH_TOKENS = 3;

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

export abstract class AuthService {
  /** Sign a JWT access token with jose */
  static async signAccessToken(payload: JWTPayload): Promise<string> {
    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(env.JWT_EXPIRES_IN!)
      .sign(ACCESS_SECRET);
  }

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
   * Login: verify credentials → enforce max 3 tokens (FIFO) → issue refresh token.
   */
  static async login(body: {
    email: string;
    password: string;
    deviceInfo?: string;
  }): Promise<{ user: UserInfo; refreshToken: string; jti: string }> {
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

    const refreshToken = crypto.randomUUID();
    const jti = crypto.randomUUID();
    const refreshExpirySeconds = parseExpiry(env.JWT_REFRESH_EXPIRES_IN);

    await db.transaction(async (tx) => {
      // Enforce max 3 active refresh tokens per user (FIFO — revoke oldest)
      const activeTokens = await tx.query.refreshTokens.findMany({
        where: and(
          eq(table.refreshTokens.userId, user.id),
          isNull(table.refreshTokens.revokedAt),
          gt(table.refreshTokens.expiresAt, new Date()),
        ),
        columns: { id: true },
        orderBy: asc(table.refreshTokens.createdAt),
      });

      if (activeTokens.length >= MAX_REFRESH_TOKENS) {
        const tokensToRevoke = activeTokens.slice(
          0,
          activeTokens.length - MAX_REFRESH_TOKENS + 1,
        );
        for (const t of tokensToRevoke) {
          await tx
            .update(table.refreshTokens)
            .set({ revokedAt: new Date() })
            .where(eq(table.refreshTokens.id, t.id));
        }
      }

      await tx.insert(table.refreshTokens).values({
        userId: user.id,
        tokenHash: hashToken(refreshToken),
        jti,
        deviceInfo: body.deviceInfo,
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
      refreshToken,
      jti,
    };
  }

  /**
   * Register a new user.
   */
  static async register(body: {
    email: string;
    password: string;
    fullName?: string;
  }): Promise<{ user: UserInfo; message: string }> {
    const existing = await db.query.users.findFirst({
      where: and(
        eq(table.users.email, body.email),
        isNull(table.users.deletedAt),
      ),
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
        role: "learner",
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
   * Refresh: rotate token + reuse detection.
   * If a rotated (revoked) token is reused → revoke ALL user tokens (token family attack).
   */
  static async refreshToken(
    refreshToken: string,
    deviceInfo?: string,
  ): Promise<{ user: UserInfo; newRefreshToken: string; jti: string }> {
    const hash = hashToken(refreshToken);

    // First, find the token record by hash (regardless of revoked status)
    const tokenRecord = await db.query.refreshTokens.findFirst({
      where: eq(table.refreshTokens.tokenHash, hash),
      columns: {
        id: true,
        userId: true,
        jti: true,
        revokedAt: true,
        replacedByJti: true,
        expiresAt: true,
      },
    });

    if (!tokenRecord) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    // Reuse detection: token already revoked → compromise detected
    if (tokenRecord.revokedAt || tokenRecord.replacedByJti) {
      // Revoke ALL tokens for this user (token family attack)
      await db
        .update(table.refreshTokens)
        .set({ revokedAt: new Date() })
        .where(
          and(
            eq(table.refreshTokens.userId, tokenRecord.userId),
            isNull(table.refreshTokens.revokedAt),
          ),
        );
      throw new UnauthorizedError(
        "Refresh token reuse detected, all sessions revoked",
      );
    }

    // Token expired
    if (tokenRecord.expiresAt <= new Date()) {
      throw new UnauthorizedError("Refresh token expired");
    }

    const user = await db.query.users.findFirst({
      where: and(
        eq(table.users.id, tokenRecord.userId),
        isNull(table.users.deletedAt),
      ),
      columns: { id: true, email: true, fullName: true, role: true },
    });

    if (!user) throw new UnauthorizedError("User not found");

    // Rotate: revoke old, issue new
    const newRefreshToken = crypto.randomUUID();
    const newJti = crypto.randomUUID();
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
        deviceInfo,
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
      jti: newJti,
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
