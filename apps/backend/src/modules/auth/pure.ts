import { BadRequestError } from "@common/errors";

/** @internal Exported for unit testing deterministic hashing behavior. */
export function hashToken(token: string): string {
  const hasher = new Bun.CryptoHasher("sha256");
  hasher.update(token);
  return hasher.digest("hex");
}

/** @internal Exported for unit testing expiry parsing edge cases. */
export function parseExpiry(str: string): number {
  const trimmed = str.trim().toLowerCase();
  const match = trimmed.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new BadRequestError(
      `Invalid expiry format: "${str}" (expected e.g. 15m, 1h, 7d)`,
    );
  }
  const value = match[1];
  const unit = match[2];
  if (!value || !unit) {
    throw new BadRequestError(`Invalid expiry format: "${str}"`);
  }
  const n = Number.parseInt(value, 10);
  if (n === 0) {
    throw new BadRequestError(`Expiry duration must be > 0: "${str}"`);
  }
  const multipliers: Record<string, number> = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
  };
  return n * (multipliers[unit] ?? 1);
}
