import { expect } from "bun:test";
import type { Role } from "@common/auth-types";
import { db, table } from "@db/index";
import { inArray, like } from "drizzle-orm";
import { app } from "@/app";

export const testEmailPrefix = "itest-";

// ---------------------------------------------------------------------------
// Request helpers
// ---------------------------------------------------------------------------

type Data = Record<string, unknown>;

interface RequestOptions {
  body?: Data;
  token?: string;
  headers?: Record<string, string>;
}

interface RequestResult {
  status: number;
  data: Data;
}

async function request(
  method: string,
  path: string,
  opts: RequestOptions = {},
): Promise<RequestResult> {
  const headers = new Headers(opts.headers);
  if (opts.body) headers.set("content-type", "application/json");
  if (opts.token) headers.set("authorization", `Bearer ${opts.token}`);

  const response = await app.handle(
    new Request(`http://localhost${path}`, {
      method,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    }),
  );

  const data = (await response.json()) as Data;
  return { status: response.status, data };
}

export const api = {
  get: (path: string, opts?: RequestOptions) => request("GET", path, opts),
  post: (path: string, opts?: RequestOptions) => request("POST", path, opts),
  patch: (path: string, opts?: RequestOptions) => request("PATCH", path, opts),
  delete: (path: string, opts?: RequestOptions) =>
    request("DELETE", path, opts),
};

// ---------------------------------------------------------------------------
// Assertion helpers
// ---------------------------------------------------------------------------

export function expectError(
  result: RequestResult,
  status: number,
  code: string,
  message?: string,
) {
  expect(result.status).toBe(status);
  const error = result.data.error as Data;
  expect(error.code).toBe(code);
  if (message) expect(error.message).toBe(message);
}

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

interface TestUserInput {
  email?: string;
  password?: string;
  fullName?: string;
  role?: Role;
}

interface TestUserResult {
  user: { id: string; email: string; fullName: string | null; role: Role };
  password: string;
}

interface LoginResult extends TestUserResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface TestClassResult {
  classId: string;
  className: string;
  inviteCode: string;
  instructor: LoginResult;
}

export function buildTestEmail(prefix = testEmailPrefix) {
  return `${prefix}${crypto.randomUUID()}@test.com`;
}

export async function createTestUser(
  input: TestUserInput = {},
): Promise<TestUserResult> {
  const password = input.password ?? "Password123!";
  const email = input.email ?? buildTestEmail();
  const passwordHash = await Bun.password.hash(password, "argon2id");

  const [user] = await db
    .insert(table.users)
    .values({
      email,
      passwordHash,
      fullName: input.fullName,
      role: input.role ?? "learner",
    })
    .returning({
      id: table.users.id,
      email: table.users.email,
      fullName: table.users.fullName,
      role: table.users.role,
    });

  if (!user) throw new Error("Failed to create test user");
  return { user, password };
}

export async function loginTestUser(
  input: TestUserInput = {},
): Promise<LoginResult> {
  const created = await createTestUser(input);
  const { data } = await api.post("/api/auth/login", {
    body: { email: created.user.email, password: created.password },
  });

  return {
    ...created,
    accessToken: data.accessToken as string,
    refreshToken: data.refreshToken as string,
    expiresIn: data.expiresIn as number,
  };
}

export async function createTestClass(
  instructorInput: TestUserInput = {},
): Promise<TestClassResult> {
  const instructor = await loginTestUser({
    role: "instructor",
    ...instructorInput,
  });

  const { data } = await api.post("/api/classes", {
    token: instructor.accessToken,
    body: { name: `Test Class ${crypto.randomUUID().slice(0, 8)}` },
  });

  return {
    classId: data.id as string,
    className: data.name as string,
    inviteCode: data.inviteCode as string,
    instructor,
  };
}

export async function joinTestClass(
  inviteCode: string,
  learnerInput: TestUserInput = {},
): Promise<LoginResult> {
  const learner = await loginTestUser({ role: "learner", ...learnerInput });
  await api.post("/api/classes/join", {
    token: learner.accessToken,
    body: { inviteCode },
  });
  return learner;
}

// ---------------------------------------------------------------------------
// Cleanup
// ---------------------------------------------------------------------------

export async function cleanupTestData(emailPrefix = testEmailPrefix) {
  const rows = await db
    .select({ id: table.users.id })
    .from(table.users)
    .where(like(table.users.email, `${emailPrefix}%`));

  const ids = rows.map((r) => r.id);
  if (ids.length === 0) return;

  // Delete in FK order: feedback → members → classes → tokens → users
  await db
    .delete(table.instructorFeedback)
    .where(inArray(table.instructorFeedback.fromUserId, ids));
  await db
    .delete(table.instructorFeedback)
    .where(inArray(table.instructorFeedback.toUserId, ids));
  await db
    .delete(table.classMembers)
    .where(inArray(table.classMembers.userId, ids));
  await db
    .delete(table.classes)
    .where(inArray(table.classes.instructorId, ids));
  await db
    .delete(table.refreshTokens)
    .where(inArray(table.refreshTokens.userId, ids));
  await db.delete(table.users).where(inArray(table.users.id, ids));
}
