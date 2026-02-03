/**
 * Auth Module Service
 * Business logic for authentication
 * Pattern: Abstract class with static methods (no instantiation)
 * @see https://elysiajs.com/pattern/mvc.html
 */

import { env } from "@common/env";
import { assertExists } from "@common/utils";
import { and, eq, gt, isNull } from "drizzle-orm";
import { SignJWT } from "jose";
import { db, table } from "@/db";
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from "@/plugins/error";
import type { AuthModel } from "./model";

/**
 * JWTPayload interface for token claims
 */
export interface JWTPayload {
  sub: string;
  email: string;
  role: "learner" | "instructor" | "admin";
  fullName: string | null;
}

/**
 * Token pair result
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Auth Service - Abstract class with static methods
 * No instantiation needed - all methods are static
 */
export abstract class AuthService {
  /**
   * Hash password using Bun's native argon2id
   */
  static async hashPassword(password: string): Promise<string> {
    return Bun.password.hash(password, {
      algorithm: "argon2id",
      memoryCost: 65536,
      timeCost: 3,
    });
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return Bun.password.verify(password, hash);
  }

  /**
   * Generate JWT access token
   */
  static async generateAccessToken(
    payload: JWTPayload,
    secret: string,
    expiresIn: string,
  ): Promise<string> {
    const secretKey = new TextEncoder().encode(secret);
    const expSeconds = parseInt(expiresIn) || 7 * 24 * 60 * 60; // default 7 days

    return new SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(expSeconds)
      .sign(secretKey);
  }

  /**
   * Generate refresh token
   */
  static generateRefreshToken(): string {
    return `refresh_${Bun.randomUUIDv7()}`;
  }

  /**
   * Sign in user with email and password
   * @throws UnauthorizedError if credentials are invalid
   */
  static async signIn(
    body: AuthModel.SignInBody,
  ): Promise<AuthModel.SignInResponse> {
    // Find user by email (excluding soft-deleted)
    const [user] = await db
      .select()
      .from(table.users)
      .where(
        and(eq(table.users.email, body.email), isNull(table.users.deletedAt)),
      )
      .limit(1);

    if (!user) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Verify password
    const isValid = await AuthService.verifyPassword(
      body.password,
      user.passwordHash,
    );
    if (!isValid) {
      throw new UnauthorizedError("Invalid email or password");
    }

    // Generate tokens
    const { accessToken, refreshToken } = await db.transaction(async (tx) => {
      const accessToken = await AuthService.generateAccessToken(
        {
          sub: user.id,
          email: user.email,
          role: user.role,
          fullName: user.fullName,
        },
        env.JWT_SECRET,
        env.JWT_EXPIRES_IN,
      );
      const refreshToken = AuthService.generateRefreshToken();

      // Store refresh token
      await tx.insert(table.refreshTokens).values({
        userId: user.id,
        tokenHash: refreshToken,
        jti: Bun.randomUUIDv7(),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      });

      return { accessToken, refreshToken };
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      accessToken,
      refreshToken,
      expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
    };
  }

  /**
   * Register new user
   * @throws ConflictError if email already exists
   */
  static async signUp(
    body: AuthModel.SignUpBody,
  ): Promise<AuthModel.SignUpResponse> {
    // Check for existing user
    const [existingUser] = await db
      .select({ id: table.users.id })
      .from(table.users)
      .where(eq(table.users.email, body.email))
      .limit(1);

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
      });

    return {
      user: assertExists(user, "User"),
      message: "Account created successfully",
    };
  }

  /**
   * Refresh access token using refresh token
   * @throws UnauthorizedError if refresh token is invalid
   */
  static async refreshToken(
    refreshToken: string,
  ): Promise<AuthModel.RefreshTokenResponse> {
    // Find valid refresh token
    const [tokenRecord] = await db
      .select({
        id: table.refreshTokens.id,
        userId: table.refreshTokens.userId,
      })
      .from(table.refreshTokens)
      .where(
        and(
          eq(table.refreshTokens.tokenHash, refreshToken),
          isNull(table.refreshTokens.revokedAt),
          gt(table.refreshTokens.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!tokenRecord) {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    // Get user
    const [user] = await db
      .select({
        id: table.users.id,
        email: table.users.email,
        role: table.users.role,
        fullName: table.users.fullName,
      })
      .from(table.users)
      .where(eq(table.users.id, tokenRecord.userId))
      .limit(1);

    if (!user) {
      throw new NotFoundError("User not found");
    }

    // Generate new tokens
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
      await db.transaction(async (tx) => {
        const accessToken = await AuthService.generateAccessToken(
          {
            sub: user.id,
            email: user.email,
            role: user.role,
            fullName: user.fullName,
          },
          env.JWT_SECRET,
          env.JWT_EXPIRES_IN,
        );
        const refreshToken = AuthService.generateRefreshToken();

        // Revoke old token and store new one
        await tx
          .update(table.refreshTokens)
          .set({ revokedAt: new Date() })
          .where(eq(table.refreshTokens.id, tokenRecord.id));

        await tx.insert(table.refreshTokens).values({
          userId: user.id,
          tokenHash: refreshToken,
          jti: Bun.randomUUIDv7(),
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        });

        return { accessToken, refreshToken };
      });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: 7 * 24 * 60 * 60,
    };
  }

  /**
   * Logout user by revoking refresh token
   */
  static async logout(refreshToken: string): Promise<{ message: string }> {
    await db
      .update(table.refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(table.refreshTokens.tokenHash, refreshToken));

    return { message: "Logged out successfully" };
  }

  /**
   * Verify JWT token and return payload
   */
  static async verifyToken(
    token: string,
    secret: string,
  ): Promise<JWTPayload | null> {
    try {
      const { jwtVerify } = await import("jose");
      const secretKey = new TextEncoder().encode(secret);
      const { payload } = await jwtVerify(token, secretKey);

      if (
        payload.sub &&
        payload.email &&
        typeof payload.sub === "string" &&
        typeof payload.email === "string"
      ) {
        return {
          sub: payload.sub,
          email: payload.email,
          role: (payload.role as JWTPayload["role"]) || "learner",
          fullName: (payload.fullName as string) || null,
        };
      }
      return null;
    } catch {
      return null;
    }
  }
}
