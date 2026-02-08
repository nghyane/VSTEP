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
import type { AuthLoginBody, AuthRegisterBody, AuthUserInfo } from "./model";

// ── Pure helpers (exported for testing) ──────────────────────────────

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

// ── Internal ────────────────────────────────────────────────────────

const ACCESS_SECRET = new TextEncoder().encode(env.JWT_SECRET);
const MAX_REFRESH_TOKENS = 3;

async function signAccessToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(ACCESS_SECRET);
}

function buildTokenResponse(
  user: AuthUserInfo,
  accessToken: string,
  refreshToken: string,
) {
  return {
    user,
    accessToken,
    refreshToken,
    expiresIn: parseExpiry(env.JWT_EXPIRES_IN),
  };
}

// ── Public API ──────────────────────────────────────────────────────

export async function login(body: AuthLoginBody, deviceInfo?: string) {
  const row = await db.query.users.findFirst({
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

  if (!row) throw new UnauthorizedError("Invalid email or password");

  const isValid = await verifyPassword(body.password, row.passwordHash);
  if (!isValid) throw new UnauthorizedError("Invalid email or password");

  const newRefreshToken = crypto.randomUUID();
  const jti = crypto.randomUUID();
  const refreshExpirySeconds = parseExpiry(env.JWT_REFRESH_EXPIRES_IN);

  await db.transaction(async (tx) => {
    const activeTokens = await tx.query.refreshTokens.findMany({
      where: and(
        eq(table.refreshTokens.userId, row.id),
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
      userId: row.id,
      tokenHash: hashToken(newRefreshToken),
      jti,
      deviceInfo,
      expiresAt: new Date(
        Date.now() + refreshExpirySeconds * 1000,
      ).toISOString(),
    });
  });

  const user: AuthUserInfo = {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
  };

  const accessToken = await signAccessToken({
    sub: row.id,
    role: row.role,
    jti,
  });

  return buildTokenResponse(user, accessToken, newRefreshToken);
}

export async function register(body: AuthRegisterBody) {
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

export async function refresh(refreshToken: string, deviceInfo?: string) {
  const hash = hashToken(refreshToken);

  return db.transaction(async (tx) => {
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

    if (tokenRecord.revokedAt || tokenRecord.replacedByJti) {
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

    const newRefreshToken = crypto.randomUUID();
    const newJti = crypto.randomUUID();
    const refreshExpirySeconds = parseExpiry(env.JWT_REFRESH_EXPIRES_IN);

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

    const accessToken = await signAccessToken({
      sub: user.id,
      role: user.role,
      jti: newJti,
    });

    return buildTokenResponse(user, accessToken, newRefreshToken);
  });
}

export async function logout(refreshToken: string) {
  await db
    .update(table.refreshTokens)
    .set({ revokedAt: now() })
    .where(eq(table.refreshTokens.tokenHash, hashToken(refreshToken)));

  return { message: "Logged out successfully" };
}
