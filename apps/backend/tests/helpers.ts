import { expect } from "bun:test";
import type { Role } from "@common/auth-types";
import { db, table } from "@db/index";
import { inArray, like } from "drizzle-orm";
import { app } from "@/app";

export const testEmailPrefix = "itest-";

let cachedDefaultHash: string | null = null;
async function getDefaultHash(): Promise<string> {
  if (!cachedDefaultHash) {
    cachedDefaultHash = await Bun.password.hash("Password123!", "argon2id");
  }
  return cachedDefaultHash;
}

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
  put: (path: string, opts?: RequestOptions) => request("PUT", path, opts),
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
  const passwordHash =
    password === "Password123!"
      ? await getDefaultHash()
      : await Bun.password.hash(password, "argon2id");

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

export interface TestQuestionResult {
  questionId: string;
  instructor: LoginResult;
}

export async function createTestQuestion(
  instructorInput: TestUserInput = {},
): Promise<TestQuestionResult> {
  const instructor = await loginTestUser({
    role: "instructor",
    ...instructorInput,
  });

  const { data } = await api.post("/api/questions", {
    token: instructor.accessToken,
    body: {
      skill: "reading",
      level: "B1",
      part: 1,
      content: {
        passage: "Test passage for integration testing.",
        items: [
          {
            stem: "What is the main idea?",
            options: ["Option A", "Option B", "Option C", "Option D"],
          },
        ],
      },
      answerKey: { correctAnswers: { "1": "0" } },
    },
  });

  return {
    questionId: data.id as string,
    instructor,
  };
}

// ---------------------------------------------------------------------------
// Exam factory
// ---------------------------------------------------------------------------

interface TestExamResult {
  examId: string;
  questionIds: {
    listening: string[];
    reading: string[];
    writing: string[];
    speaking: string[];
  };
  admin: LoginResult;
}

export async function createTestExam(
  emailPrefix?: string,
): Promise<TestExamResult> {
  const [admin, instructor] = await Promise.all([
    loginTestUser({ role: "admin", email: buildTestEmail(emailPrefix) }),
    loginTestUser({ role: "instructor", email: buildTestEmail(emailPrefix) }),
  ]);

  const buildObjectiveItems = (
    skill: "listening" | "reading",
    part: number,
    itemCount: number,
  ) =>
    Array.from({ length: itemCount }, (_, index) => ({
      stem: `${skill} part ${part} item ${index + 1}`,
      options: [
        `Option A${index + 1}`,
        `Option B${index + 1}`,
        `Option C${index + 1}`,
        `Option D${index + 1}`,
      ],
    }));

  const buildObjectiveAnswerKey = (itemCount: number) => ({
    correctAnswers: Object.fromEntries(
      Array.from({ length: itemCount }, (_, index) => [String(index + 1), "A"]),
    ),
  });

  const createQ = async (
    skill: "listening" | "reading" | "writing" | "speaking",
    part: number,
    content: Record<string, unknown>,
    answerKey?: Record<string, unknown>,
  ) => {
    const { data } = await api.post("/api/questions", {
      token: instructor.accessToken,
      body: {
        skill,
        level: "B2",
        part,
        content,
        ...(answerKey && { answerKey }),
      },
    });
    return data.id as string;
  };

  const listening = await Promise.all(
    [
      { part: 1, itemCount: 8 },
      { part: 2, itemCount: 12 },
      { part: 3, itemCount: 15 },
    ].map(({ part, itemCount }) =>
      createQ(
        "listening",
        part,
        {
          audioUrl: `https://example.com/listening-part-${part}.mp3`,
          transcript: `Listening part ${part} transcript for integration tests.`,
          items: buildObjectiveItems("listening", part, itemCount),
        },
        buildObjectiveAnswerKey(itemCount),
      ),
    ),
  );

  const reading = await Promise.all(
    [1, 2, 3, 4].map((part) =>
      createQ(
        "reading",
        part,
        {
          title: `Reading part ${part}`,
          passage: `Integration test reading passage for part ${part}.`,
          items: buildObjectiveItems("reading", part, 10),
        },
        buildObjectiveAnswerKey(10),
      ),
    ),
  );

  const writing = await Promise.all([
    createQ("writing", 1, {
      prompt: "Write a formal letter about test coverage improvements.",
      taskType: "letter",
      minWords: 120,
    }),
    createQ("writing", 2, {
      prompt: "Write an essay about the impact of automated testing.",
      taskType: "essay",
      minWords: 250,
    }),
  ]);

  const speakingPart1 = await createQ("speaking", 1, {
    topics: [
      {
        name: "Testing",
        questions: [
          "What is testing?",
          "Why is testing important?",
          "How do you test?",
        ],
      },
      {
        name: "Experience",
        questions: [
          "Tell me about your experience.",
          "What did you learn?",
          "What would you change?",
        ],
      },
    ],
  });

  const speakingPart2 = await createQ("speaking", 2, {
    situation: "Your class plans an English club event this weekend.",
    options: [
      "Invite a guest speaker",
      "Run a debate session",
      "Host a role-play workshop",
    ],
    preparationSeconds: 60,
    speakingSeconds: 120,
  });

  const speakingPart3 = await createQ("speaking", 3, {
    centralIdea: "How students can improve speaking confidence",
    suggestions: [
      "Practice daily with peers",
      "Join public speaking activities",
      "Record and review responses",
    ],
    followUpQuestion: "Which strategy would you choose first and why?",
    preparationSeconds: 60,
    speakingSeconds: 300,
  });

  const speaking = [speakingPart1, speakingPart2, speakingPart3];

  const { data } = await api.post("/api/exams", {
    token: admin.accessToken,
    body: {
      title: "Đề thi VSTEP B2 - Test",
      level: "B2",
      blueprint: {
        listening: { questionIds: listening },
        reading: { questionIds: reading },
        writing: { questionIds: writing },
        speaking: { questionIds: speaking },
      },
    },
  });

  return {
    examId: data.id as string,
    questionIds: {
      listening,
      reading,
      writing,
      speaking,
    },
    admin,
  };
}

// ---------------------------------------------------------------------------
// Scoped test context — each test file gets its own namespace
// ---------------------------------------------------------------------------

export interface TestContext {
  prefix: string;
  cleanup: () => Promise<void>;
  buildEmail: () => string;
  createUser: (input?: TestUserInput) => Promise<TestUserResult>;
  login: (input?: TestUserInput) => Promise<LoginResult>;
  createQuestion: (
    instructorInput?: TestUserInput,
  ) => Promise<TestQuestionResult>;
  createExam: () => Promise<TestExamResult>;
  createClass: (instructorInput?: TestUserInput) => Promise<TestClassResult>;
  joinClass: (
    inviteCode: string,
    learnerInput?: TestUserInput,
  ) => Promise<LoginResult>;
}

export function createTestContext(): TestContext {
  const prefix = `t-${crypto.randomUUID().slice(0, 8)}-`;

  const buildEmail = () => buildTestEmail(prefix);

  const withEmail = (input?: TestUserInput): TestUserInput => ({
    ...input,
    email: input?.email ?? buildEmail(),
  });

  return {
    prefix,
    cleanup: () => cleanupTestData(prefix),
    buildEmail,
    createUser: (input?) => createTestUser(withEmail(input)),
    login: (input?) => loginTestUser(withEmail(input)),
    createQuestion: (instructorInput?) =>
      createTestQuestion(withEmail({ role: "instructor", ...instructorInput })),
    createExam: () => createTestExam(prefix),
    createClass: (instructorInput?) =>
      createTestClass(withEmail({ role: "instructor", ...instructorInput })),
    joinClass: (inviteCode, learnerInput?) =>
      joinTestClass(
        inviteCode,
        withEmail({ role: "learner", ...learnerInput }),
      ),
  };
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

  // Progress data
  await db
    .delete(table.userSkillScores)
    .where(inArray(table.userSkillScores.userId, ids));
  await db
    .delete(table.userProgress)
    .where(inArray(table.userProgress.userId, ids));
  await db.delete(table.userGoals).where(inArray(table.userGoals.userId, ids));

  // Exam data (before submissions due to examSubmissions FK)
  const sessionIds = await db
    .select({ id: table.examSessions.id })
    .from(table.examSessions)
    .where(inArray(table.examSessions.userId, ids));
  const sIds = sessionIds.map((r) => r.id);
  if (sIds.length > 0) {
    await db
      .delete(table.examSubmissions)
      .where(inArray(table.examSubmissions.sessionId, sIds));
    await db
      .delete(table.examAnswers)
      .where(inArray(table.examAnswers.sessionId, sIds));
  }
  await db
    .delete(table.examSessions)
    .where(inArray(table.examSessions.userId, ids));

  // Submissions (submissionDetails cascades via FK, but be safe)
  const subIds = await db
    .select({ id: table.submissions.id })
    .from(table.submissions)
    .where(inArray(table.submissions.userId, ids));
  const submissionIdList = subIds.map((r) => r.id);
  if (submissionIdList.length > 0) {
    await db
      .delete(table.submissionDetails)
      .where(inArray(table.submissionDetails.submissionId, submissionIdList));
  }
  await db
    .delete(table.submissions)
    .where(inArray(table.submissions.userId, ids));

  // Exams (created by test users)
  await db.delete(table.exams).where(inArray(table.exams.createdBy, ids));

  // Delete in FK order: questions → feedback → members → classes → tokens → users
  await db
    .delete(table.questions)
    .where(inArray(table.questions.createdBy, ids));
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
