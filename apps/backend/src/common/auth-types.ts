import type { userRoleEnum } from "@db/schema/users";

export type Role = (typeof userRoleEnum.enumValues)[number];

export const ROLES = {
  LEARNER: "learner",
  INSTRUCTOR: "instructor",
  ADMIN: "admin",
} as const satisfies Record<string, Role>;

export const ROLE_LEVEL: Record<Role, number> = {
  learner: 0,
  instructor: 1,
  admin: 2,
};

export type JWTPayload = { sub: string; role: Role };

export type Actor = JWTPayload & { is(required: Role): boolean };
