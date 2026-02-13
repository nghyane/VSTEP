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
      level: "B2",
      format: "reading_mcq",
      content: {
        passage: "Test passage for integration testing.",
        items: [
          {
            number: 1,
            prompt: "What is the main idea?",
            options: {
              A: "Option A",
              B: "Option B",
              C: "Option C",
              D: "Option D",
            },
          },
        ],
      },
      answerKey: { correctAnswers: { "1": "A" } },
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

export async function createTestExam(): Promise<TestExamResult> {
  const admin = await loginTestUser({ role: "admin" });
  const instructor = await loginTestUser({ role: "instructor" });

  const createQ = async (
    skill: string,
    format: string,
    content: Record<string, unknown>,
    answerKey?: Record<string, unknown>,
  ) => {
    const { data } = await api.post("/api/questions", {
      token: instructor.accessToken,
      body: {
        skill,
        level: "B2",
        format,
        content,
        ...(answerKey && { answerKey }),
      },
    });
    return data.id as string;
  };

  const listeningId = await createQ(
    "listening",
    "listening_mcq",
    {
      audioUrl: "https://example.com/audio.mp3",
      items: [
        {
          number: 1,
          prompt: "What did the speaker say?",
          options: { A: "Hello", B: "Goodbye", C: "Thanks", D: "Sorry" },
        },
      ],
    },
    { correctAnswers: { "1": "A" } },
  );

  const readingId = await createQ(
    "reading",
    "reading_mcq",
    {
      passage: "Integration test passage.",
      items: [
        {
          number: 1,
          prompt: "Main idea?",
          options: { A: "A", B: "B", C: "C", D: "D" },
        },
      ],
    },
    { correctAnswers: { "1": "A" } },
  );

  const writingId = await createQ("writing", "writing_task_1", {
    taskNumber: 1,
    prompt: "Write about testing.",
  });

  const speakingId = await createQ("speaking", "speaking_part_1", {
    partNumber: 1,
    prompt: "Talk about your experience with testing.",
  });

  const { data } = await api.post("/api/exams", {
    token: admin.accessToken,
    body: {
      level: "B2",
      blueprint: {
        listening: { questionIds: [listeningId] },
        reading: { questionIds: [readingId] },
        writing: { questionIds: [writingId] },
        speaking: { questionIds: [speakingId] },
      },
    },
  });

  return {
    examId: data.id as string,
    questionIds: {
      listening: [listeningId],
      reading: [readingId],
      writing: [writingId],
      speaking: [speakingId],
    },
    admin,
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

  // Delete in FK order: question_versions → questions → feedback → members → classes → tokens → users
  await db
    .delete(table.questionVersions)
    .where(
      inArray(
        table.questionVersions.questionId,
        db
          .select({ id: table.questions.id })
          .from(table.questions)
          .where(inArray(table.questions.createdBy, ids)),
      ),
    );
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
