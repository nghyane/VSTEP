import { ARGON2_CONFIG } from "@common/constants";

/**
 * Password hashing utilities using Bun's built-in Argon2id.
 * Extracted from AuthService to avoid cross-module coupling.
 */
export async function hashPassword(password: string): Promise<string> {
  return Bun.password.hash(password, ARGON2_CONFIG);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return Bun.password.verify(password, hash);
}
