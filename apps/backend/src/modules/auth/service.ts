import { MAX_REFRESH_TOKENS_PER_USER } from "@common/constants";
import { env } from "@common/env";
import { AUTH_MESSAGES } from "@common/messages";
import { hashPassword, verifyPassword } from "@common/password";
import { assertExists, normalizeEmail, now } from "@common/utils";
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
import { hashToken, parseExpiry } from "./pure";

// ── Pure helpers (exported for testing) ──────────────────────────────

export { hashToken, parseExpiry };

// ── Internal ────────────────────────────────────────────────────────

const ACCESS_SECRET = new TextEncoder().encode(env.JWT_SECRET);

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
  const email = normalizeEmail(body.email);

  const row = await db.query.users.findFirst({
    where: and(eq(table.users.email, email), isNull(table.users.deletedAt)),
    columns: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      passwordHash: true,
    },
  });

  if (!row) throw new UnauthorizedError(AUTH_MESSAGES.invalidCredentials);

  const isValid = await verifyPassword(body.password, row.passwordHash);
  if (!isValid) throw new UnauthorizedError(AUTH_MESSAGES.invalidCredentials);

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

    if (activeTokens.length >= MAX_REFRESH_TOKENS_PER_USER) {
      const tokensToRevoke = activeTokens.slice(
        0,
        activeTokens.length - MAX_REFRESH_TOKENS_PER_USER + 1,
      );
      const idsToRevoke = tokensToRevoke.map((token) => token.id);
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
  const email = normalizeEmail(body.email);
  const passwordHash = await hashPassword(body.password);

  try {
    const [user] = await db
      .insert(table.users)
      .values({
        email,
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
      throw new ConflictError(AUTH_MESSAGES.emailAlreadyRegistered);
    }
    throw e;
  }
}

export async function refresh(refreshToken: string, deviceInfo?: string) {
  const hash = hashToken(refreshToken);
  const newJti = crypto.randomUUID();

  return db.transaction(async (tx) => {
    // Atomic rotate: only one concurrent request can win this UPDATE
    const [rotated] = await tx
      .update(table.refreshTokens)
      .set({ revokedAt: now(), replacedByJti: newJti })
      .where(
        and(
          eq(table.refreshTokens.tokenHash, hash),
          isNull(table.refreshTokens.revokedAt),
          isNull(table.refreshTokens.replacedByJti),
          gt(table.refreshTokens.expiresAt, now()),
        ),
      )
      .returning({
        id: table.refreshTokens.id,
        userId: table.refreshTokens.userId,
        jti: table.refreshTokens.jti,
      });

    // If no row returned, figure out why
    if (!rotated) {
      const existing = await tx.query.refreshTokens.findFirst({
        where: eq(table.refreshTokens.tokenHash, hash),
        columns: {
          userId: true,
          revokedAt: true,
          replacedByJti: true,
          expiresAt: true,
        },
      });

      if (!existing) {
        throw new UnauthorizedError(AUTH_MESSAGES.tokenInvalid);
      }

      if (new Date(existing.expiresAt) <= new Date()) {
        throw new UnauthorizedError(AUTH_MESSAGES.tokenExpired);
      }

      // Reuse detected — revoke ALL active tokens for this user
      await tx
        .update(table.refreshTokens)
        .set({ revokedAt: now() })
        .where(
          and(
            eq(table.refreshTokens.userId, existing.userId),
            isNull(table.refreshTokens.revokedAt),
          ),
        );
      throw new UnauthorizedError(AUTH_MESSAGES.tokenReuseDetected);
    }

    const user = await tx.query.users.findFirst({
      where: and(
        eq(table.users.id, rotated.userId),
        isNull(table.users.deletedAt),
      ),
      columns: { id: true, email: true, fullName: true, role: true },
    });

    if (!user) throw new UnauthorizedError(AUTH_MESSAGES.userNotFound);

    const newRefreshToken = crypto.randomUUID();
    const refreshExpirySeconds = parseExpiry(env.JWT_REFRESH_EXPIRES_IN);

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
