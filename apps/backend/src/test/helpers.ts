import type { Role } from "@common/auth-types";
import { hashPassword } from "@common/password";
import { db, table } from "@db/index";
import { inArray, like } from "drizzle-orm";
import { app } from "@/app";

export const testEmailPrefix = "itest-";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

type JsonObject = { [key: string]: JsonValue };

interface TestUserInput {
  email?: string;
  password?: string;
  fullName?: string;
  role?: Role;
}

interface TestUserResult {
  user: {
    id: string;
    email: string;
    fullName: string | null;
    role: Role;
  };
  password: string;
}

interface LoginTestUserResult extends TestUserResult {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface MakeRequestOptions {
  method?: string;
  path: string;
  body?: JsonObject;
  token?: string;
  headers?: Record<string, string>;
}

interface MakeRequestResult {
  response: Response;
  status: number;
  data: JsonValue | string | null;
}

interface CleanupTestDataOptions {
  emailPrefix?: string;
  userIds?: string[];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function buildTestEmail(prefix = testEmailPrefix): string {
  return `${prefix}${crypto.randomUUID()}@test.com`;
}

export function createTestApp() {
  return app;
}

export async function createTestUser(
  input: TestUserInput = {},
): Promise<TestUserResult> {
  const password = input.password ?? "Password123!";
  const email = input.email ?? buildTestEmail();
  const passwordHash = await hashPassword(password);

  const [createdUser] = await db
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

  if (!createdUser) {
    throw new Error("Failed to create test user");
  }

  return {
    user: createdUser,
    password,
  };
}

export async function loginTestUser(
  input: TestUserInput = {},
): Promise<LoginTestUserResult> {
  const created = await createTestUser(input);

  const loginResponse = await makeRequest({
    method: "POST",
    path: "/api/auth/login",
    body: {
      email: created.user.email,
      password: created.password,
    },
  });

  if (loginResponse.status !== 200 || !isRecord(loginResponse.data)) {
    throw new Error("Failed to login test user");
  }

  const accessToken = loginResponse.data.accessToken;
  const refreshToken = loginResponse.data.refreshToken;
  const expiresIn = loginResponse.data.expiresIn;

  if (
    typeof accessToken !== "string" ||
    typeof refreshToken !== "string" ||
    typeof expiresIn !== "number"
  ) {
    throw new Error("Login response is missing token fields");
  }

  return {
    ...created,
    accessToken,
    refreshToken,
    expiresIn,
  };
}

export async function cleanupTestData(
  options: CleanupTestDataOptions = {},
): Promise<void> {
  const prefix = options.emailPrefix ?? testEmailPrefix;

  const usersByPrefix = await db
    .select({ id: table.users.id })
    .from(table.users)
    .where(like(table.users.email, `${prefix}%`));

  const userIdSet = new Set(options.userIds ?? []);
  for (const row of usersByPrefix) {
    userIdSet.add(row.id);
  }

  const userIds = Array.from(userIdSet);

  if (userIds.length === 0) {
    return;
  }

  await db
    .delete(table.refreshTokens)
    .where(inArray(table.refreshTokens.userId, userIds));

  await db.delete(table.users).where(inArray(table.users.id, userIds));
}

export async function makeRequest(
  options: MakeRequestOptions,
): Promise<MakeRequestResult> {
  const method = options.method ?? "GET";
  const requestHeaders = new Headers(options.headers);

  if (options.body) {
    requestHeaders.set("content-type", "application/json");
  }

  if (options.token) {
    requestHeaders.set("authorization", `Bearer ${options.token}`);
  }

  const response = await createTestApp().handle(
    new Request(`http://localhost${options.path}`, {
      method,
      headers: requestHeaders,
      body: options.body ? JSON.stringify(options.body) : undefined,
    }),
  );

  const contentType = response.headers.get("content-type") ?? "";
  let data: JsonValue | string | null = null;

  if (contentType.includes("application/json")) {
    data = (await response.json()) as JsonValue;
  } else {
    data = await response.text();
  }

  return {
    response,
    status: response.status,
    data,
  };
}
