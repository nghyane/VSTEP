export type Role = "learner" | "instructor" | "admin";

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

export interface JWTPayload {
  sub: string;
  jti: string;
  role: Role;
}

export interface Actor extends JWTPayload {
  is(required: Role): boolean;
}
