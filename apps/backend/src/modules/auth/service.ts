import { ROLES } from "@common/auth-types";
import { JWT_SECRET_KEY, MAX_REFRESH_TOKENS_PER_USER } from "@common/constants";
import { env } from "@common/env";
import { ConflictError, UnauthorizedError } from "@common/errors";
import { normalizeEmail } from "@common/utils";
import { db, table } from "@db/index";
import { and, asc, eq, gt, inArray, isNull } from "drizzle-orm";
import { SignJWT } from "jose";
import { hashToken, parseExpiry } from "./helpers";
import type { AuthUser, LoginBody, RegisterBody } from "./schema";

const AUTH_USER_RETURNING = {
  id: table.users.id,
  email: table.users.email,
  fullName: table.users.fullName,
  role: table.users.role,
};

async function signAccessToken(sub: string, role: string) {
  return new SignJWT({ sub, role })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(env.JWT_EXPIRES_IN)
    .sign(JWT_SECRET_KEY);
}

function tokenResponse(user: AuthUser, access: string, refresh: string) {
  return {
    user,
    accessToken: access,
    refreshToken: refresh,
    expiresIn: parseExpiry(env.JWT_EXPIRES_IN),
  };
}

function refreshExpiry() {
  return new Date(
    Date.now() + parseExpiry(env.JWT_REFRESH_EXPIRES_IN) * 1000,
  ).toISOString();
}

export async function login(body: LoginBody, deviceInfo?: string) {
  const email = normalizeEmail(body.email);

  const row = await db.query.users.findFirst({
    where: eq(table.users.email, email),
    columns: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      passwordHash: true,
    },
  });

  if (!row) throw new UnauthorizedError("Invalid email or password");
  if (!(await Bun.password.verify(body.password, row.passwordHash))) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const tok = crypto.randomUUID();
  const jti = crypto.randomUUID();

  await db.transaction(async (tx) => {
    const active = await tx.query.refreshTokens.findMany({
      where: and(
        eq(table.refreshTokens.userId, row.id),
        isNull(table.refreshTokens.revokedAt),
        gt(table.refreshTokens.expiresAt, new Date().toISOString()),
      ),
      columns: { id: true },
      orderBy: asc(table.refreshTokens.createdAt),
    });

    if (active.length >= MAX_REFRESH_TOKENS_PER_USER) {
      const ids = active
        .slice(0, active.length - MAX_REFRESH_TOKENS_PER_USER + 1)
        .map((t) => t.id);
      await tx
        .update(table.refreshTokens)
        .set({ revokedAt: new Date().toISOString() })
        .where(inArray(table.refreshTokens.id, ids));
    }

    await tx.insert(table.refreshTokens).values({
      userId: row.id,
      tokenHash: hashToken(tok),
      jti,
      deviceInfo,
      expiresAt: refreshExpiry(),
    });
  });

  const user: AuthUser = {
    id: row.id,
    email: row.email,
    fullName: row.fullName,
    role: row.role,
  };
  const access = await signAccessToken(row.id, row.role);

  return tokenResponse(user, access, tok);
}

export async function register(body: RegisterBody) {
  const email = normalizeEmail(body.email);
  const hash = await Bun.password.hash(body.password, "argon2id");

  const [user] = await db
    .insert(table.users)
    .values({
      email,
      passwordHash: hash,
      fullName: body.fullName,
      role: ROLES.LEARNER,
    })
    .onConflictDoNothing()
    .returning(AUTH_USER_RETURNING);

  if (!user) throw new ConflictError("Email already registered");
  return { user, message: "Account created successfully" };
}

export async function refresh(refreshToken: string, deviceInfo?: string) {
  const hash = hashToken(refreshToken);
  const jti = crypto.randomUUID();

  // Attempt atomic rotation: revoke old token and find its owner in one UPDATE.
  const [rotated] = await db
    .update(table.refreshTokens)
    .set({ revokedAt: new Date().toISOString(), replacedByJti: jti })
    .where(
      and(
        eq(table.refreshTokens.tokenHash, hash),
        isNull(table.refreshTokens.revokedAt),
        isNull(table.refreshTokens.replacedByJti),
        gt(table.refreshTokens.expiresAt, new Date().toISOString()),
      ),
    )
    .returning({
      id: table.refreshTokens.id,
      userId: table.refreshTokens.userId,
      jti: table.refreshTokens.jti,
    });

  if (!rotated) {
    // Token not active — determine reason for a clear error message.
    const existing = await db.query.refreshTokens.findFirst({
      where: eq(table.refreshTokens.tokenHash, hash),
      columns: {
        userId: true,
        revokedAt: true,
        replacedByJti: true,
        expiresAt: true,
      },
    });

    if (!existing) throw new UnauthorizedError("Invalid refresh token");

    if (new Date(existing.expiresAt) <= new Date()) {
      throw new UnauthorizedError("Refresh token expired");
    }

    // Token was explicitly revoked (logout) — not reuse
    if (existing.revokedAt && !existing.replacedByJti) {
      throw new UnauthorizedError("Refresh token has been revoked");
    }

    // Token was already rotated — genuine reuse, revoke all active sessions.
    // Runs outside the issuing transaction so the revocation persists even
    // though we throw afterwards.
    if (existing.replacedByJti) {
      await db
        .update(table.refreshTokens)
        .set({ revokedAt: new Date().toISOString() })
        .where(
          and(
            eq(table.refreshTokens.userId, existing.userId),
            isNull(table.refreshTokens.revokedAt),
          ),
        );
      throw new UnauthorizedError(
        "Refresh token reuse detected, all sessions revoked",
      );
    }

    throw new UnauthorizedError("Invalid refresh token");
  }

  // Happy path: issue a new token pair inside a transaction.
  return db.transaction(async (tx) => {
    const user = await tx.query.users.findFirst({
      where: eq(table.users.id, rotated.userId),
      columns: { id: true, email: true, fullName: true, role: true },
    });

    if (!user) throw new UnauthorizedError("User not found");

    const tok = crypto.randomUUID();

    await tx.insert(table.refreshTokens).values({
      userId: user.id,
      tokenHash: hashToken(tok),
      jti,
      deviceInfo,
      expiresAt: refreshExpiry(),
    });

    const access = await signAccessToken(user.id, user.role);
    return tokenResponse(user, access, tok);
  });
}

export async function logout(refreshToken: string, userId: string) {
  await db
    .update(table.refreshTokens)
    .set({ revokedAt: new Date().toISOString() })
    .where(
      and(
        eq(table.refreshTokens.tokenHash, hashToken(refreshToken)),
        eq(table.refreshTokens.userId, userId),
      ),
    );

  return { message: "Logged out successfully" };
}
