export const MAX_PAGE_SIZE = 100;

export const ARGON2_CONFIG = {
  algorithm: "argon2id" as const,
  memoryCost: 65536,
  timeCost: 3,
};

export const MAX_REFRESH_TOKENS_PER_USER = 3;
