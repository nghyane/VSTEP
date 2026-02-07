import { env } from "@common/env";
import { assertExists, now } from "@common/utils";
import { and, asc, eq, gt, inArray, isNull } from "drizzle-orm";
import { SignJWT } from "jose";
import { db, table } from "@/db";
import type { JWTPayload } from "@/plugins/auth";
import { ConflictError, UnauthorizedError } from "@/plugins/error";
import type { AuthModel } from "./model";

const ACCESS_SECRET = new TextEncoder().encode(env.JWT_SECRET!);
const MAX_REFRESH_TOKENS = 3;

type UserInfo = AuthModel.UserInfo;

interface TokenResponse {
  user: UserInfo;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

function parseExpiry(str: string): number {
  const match = str.match(/^(\d+)(s|m|h|d)$/);
  if (!match) {
    throw new Error(
      `Invalid expiry format: "${str}" (expected e.g. "15m", "7d")`,
    );
  }
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
      throw new Error(`Invalid expiry unit: "${match[2]}"`);
  }
}

/** Pre-compute at module load — bad config crashes at startup, not at first request */
const ACCESS_EXPIRY_SECONDS = parseExpiry(env.JWT_EXPIRES_IN);
const REFRESH_EXPIRY_SECONDS = parseExpiry(env.JWT_REFRESH_EXPIRES_IN!);

function hashToken(token: string): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(token);
  return hasher.digest("hex");
}

/** Sign access token + build the full token response */
async function buildTokenResponse(
  user: UserInfo,
  jti: string,
  rawRefreshToken: string,
): Promise<TokenResponse> {
  const accessToken = await new SignJWT({
    sub: user.id,
    role: user.role,
    jti,
  } satisfies JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(env.JWT_EXPIRES_IN!)
    .sign(ACCESS_SECRET);

  return {
    user,
    accessToken,
    refreshToken: rawRefreshToken,
    expiresIn: ACCESS_EXPIRY_SECONDS,
  };
}

export class AuthService {
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

  static async login(body: {
    email: string;
    password: string;
    deviceInfo?: string;
  }): Promise<TokenResponse> {
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

    await db.transaction(async (tx) => {
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
        tokenHash: hashToken(refreshToken),
        jti,
        deviceInfo: body.deviceInfo,
        expiresAt: new Date(
          Date.now() + REFRESH_EXPIRY_SECONDS * 1000,
        ).toISOString(),
      });
    });

    const userInfo: UserInfo = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    };

    return buildTokenResponse(userInfo, jti, refreshToken);
  }

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

  static async refreshToken(
    refreshToken: string,
    deviceInfo?: string,
  ): Promise<TokenResponse> {
    const hash = hashToken(refreshToken);

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
      await db
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

    await db.transaction(async (tx) => {
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
          Date.now() + REFRESH_EXPIRY_SECONDS * 1000,
        ).toISOString(),
      });
    });

    return buildTokenResponse(user, newJti, newRefreshToken);
  }

  static async logout(refreshToken: string): Promise<{ message: string }> {
    await db
      .update(table.refreshTokens)
      .set({ revokedAt: now() })
      .where(eq(table.refreshTokens.tokenHash, hashToken(refreshToken)));

    return { message: "Logged out successfully" };
  }
}
