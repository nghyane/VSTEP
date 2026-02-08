import { env } from "@common/env";
import { hashPassword, verifyPassword } from "@common/password";
import { assertExists, now } from "@common/utils";
import { and, asc, eq, gt, inArray, isNull } from "drizzle-orm";
import { SignJWT } from "jose";
import { db, table } from "@/db";
import type { JWTPayload } from "@/plugins/auth";
import {
  ConflictError,
  isUniqueViolation,
  UnauthorizedError,
} from "@/plugins/error";
import type { AuthUserInfo } from "./model";

if (!env.JWT_SECRET) throw new Error("JWT_SECRET is required");
if (!env.JWT_EXPIRES_IN) throw new Error("JWT_EXPIRES_IN is required");
if (!env.JWT_REFRESH_EXPIRES_IN)
  throw new Error("JWT_REFRESH_EXPIRES_IN is required");

const ACCESS_SECRET = new TextEncoder().encode(env.JWT_SECRET);
const JWT_EXPIRES_IN: string = env.JWT_EXPIRES_IN;
const JWT_REFRESH_EXPIRES_IN: string = env.JWT_REFRESH_EXPIRES_IN;

const MAX_REFRESH_TOKENS = 3;

type UserInfo = AuthUserInfo;

export function hashToken(token: string): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(token);
  return hasher.digest("hex");
}

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

export async function signAccessToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(ACCESS_SECRET);
}

export async function login(body: {
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

  const isValid = await verifyPassword(body.password, user.passwordHash);
  if (!isValid) throw new UnauthorizedError("Invalid email or password");

  const newRefreshToken = crypto.randomUUID();
  const jti = crypto.randomUUID();
  const refreshExpirySeconds = parseExpiry(JWT_REFRESH_EXPIRES_IN);

  await db.transaction(async (tx) => {
    // Enforce max 3 active refresh tokens per user (FIFO — revoke oldest)
    const activeTokens = await tx.query.refreshTokens.findMany({
      where: and(
        eq(table.refreshTokens.userId, user.id),
        isNull(table.refreshTokens.revokedAt),
        gt(table.refreshTokens.expiresAt, now()),
      ),
      columns: { id: true },
      orderBy: asc(table.refreshTokens.createdAt),
    });

    if (activeTokens.length >= MAX_REFRESH_TOKENS) {
      const tokensToRevoke = activeTokens.slice(
        0,
        activeTokens.length - MAX_REFRESH_TOKENS + 1,
      );
      const idsToRevoke = tokensToRevoke.map((t) => t.id);
      await tx
        .update(table.refreshTokens)
        .set({ revokedAt: now() })
        .where(inArray(table.refreshTokens.id, idsToRevoke));
    }

    await tx.insert(table.refreshTokens).values({
      userId: user.id,
      tokenHash: hashToken(newRefreshToken),
      jti,
      deviceInfo: body.deviceInfo,
      expiresAt: new Date(
        Date.now() + refreshExpirySeconds * 1000,
      ).toISOString(),
    });
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    refreshToken: newRefreshToken,
    jti,
  };
}

export async function register(body: {
  email: string;
  password: string;
  fullName?: string;
}): Promise<{ user: UserInfo; message: string }> {
  const passwordHash = await hashPassword(body.password);

  try {
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
  } catch (e: unknown) {
    if (isUniqueViolation(e)) {
      throw new ConflictError("Email already registered");
    }
    throw e;
  }
}

export async function refreshToken(
  token: string,
  deviceInfo?: string,
): Promise<{ user: UserInfo; newRefreshToken: string; jti: string }> {
  const hash = hashToken(token);

  return db.transaction(async (tx) => {
    // Find the token record by hash (regardless of revoked status)
    const tokenRecord = await tx.query.refreshTokens.findFirst({
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
      await tx
        .update(table.refreshTokens)
        .set({ revokedAt: now() })
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
    if (new Date(tokenRecord.expiresAt) <= new Date()) {
      throw new UnauthorizedError("Refresh token expired");
    }

    const user = await tx.query.users.findFirst({
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
    const refreshExpirySeconds = parseExpiry(JWT_REFRESH_EXPIRES_IN);

    await tx
      .update(table.refreshTokens)
      .set({ revokedAt: now(), replacedByJti: newJti })
      .where(eq(table.refreshTokens.id, tokenRecord.id));

    await tx.insert(table.refreshTokens).values({
      userId: user.id,
      tokenHash: hashToken(newRefreshToken),
      jti: newJti,
      deviceInfo,
      expiresAt: new Date(
        Date.now() + refreshExpirySeconds * 1000,
      ).toISOString(),
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
  });
}

export async function logout(token: string): Promise<{ message: string }> {
  await db
    .update(table.refreshTokens)
    .set({ revokedAt: now() })
    .where(eq(table.refreshTokens.tokenHash, hashToken(token)));

  return { message: "Logged out successfully" };
}
