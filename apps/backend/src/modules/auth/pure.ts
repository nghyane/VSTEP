import { BadRequestError } from "@common/errors";

/** @internal Exported for unit testing deterministic hashing behavior. */
export const hashToken = (token: string) =>
  new Bun.CryptoHasher("sha256").update(token).digest("hex");

/** @internal Exported for unit testing expiry parsing edge cases. */
export function parseExpiry(str: string) {
  const m = str
    .trim()
    .toLowerCase()
    .match(/^(\d+)([smhd])$/);
  if (!m) {
    throw new BadRequestError(
      `Invalid expiry format: "${str}" (expected e.g. 15m, 1h, 7d)`,
    );
  }
  const value = m[1] ?? "";
  const unit = m[2] ?? "s";
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
