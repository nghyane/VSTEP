import { env } from "@common/env";

export const MAX_PAGE_SIZE = 100;

export const MAX_REFRESH_TOKENS_PER_USER = 3;

/** Pre-encoded JWT secret — shared between token signing and verification. */
export const JWT_SECRET_KEY = new TextEncoder().encode(env.JWT_SECRET);
