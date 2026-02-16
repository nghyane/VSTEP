import type { DbTransaction } from "../../src/db/index";
import { table } from "../../src/db/schema/index";
import type { NewSubmission } from "../../src/db/schema/submissions";
import type { SubmissionAnswer } from "../../src/db/types/answers";
import type { Result } from "../../src/db/types/grading";
import { logResult, logSection } from "../utils";
import type { SeededUsers } from "./01-users";
import type { SeededQuestions } from "./02-questions";

export interface SeededSubmissions {
  all: Array<{ id: string; skill: string; userId: string; status: string }>;
}

function findQuestion(
  questions: SeededQuestions["all"],
  skill: string,
): string {
  const q = questions.find((q) => q.skill === skill);
  if (!q) throw new Error(`No question found for skill: ${skill}`);
  return q.id;
}

function objectiveAnswer(count: number): SubmissionAnswer {
  const answers: Record<string, string> = {};
  const options = ["A", "B", "C", "D"];
  for (let i = 1; i <= count; i++) {
    answers[String(i)] = options[i % options.length];
  }
  return { answers };
}

function autoGradeResult(
  correct: number,
  total: number,
  score: number,
  band: string,
): Result {
  return {
    type: "auto" as const,
    correctCount: correct,
    totalCount: total,
    score,
    band,
    gradedAt: new Date().toISOString(),
  };
}

function aiGradeResult(
  overallScore: number,
  band: string,
  confidence: "high" | "medium" | "low",
): Result {
  return {
    type: "ai" as const,
    overallScore,
    band,
    criteriaScores: {
      taskAchievement: overallScore + 0.5,
      coherenceCohesion: overallScore - 0.5,
      lexicalResource: overallScore,
      grammaticalRange: overallScore - 0.5,
    },
    feedback: `Overall performance at ${band} level. ${confidence === "high" ? "Strong command of language." : confidence === "medium" ? "Adequate but inconsistent performance." : "Needs significant improvement."}`,
    confidence,
    gradedAt: new Date().toISOString(),
  };
}

interface SubmissionSeed {
  submission: NewSubmission;
  answer: SubmissionAnswer;
  result: Result | null;
}

export async function seedSubmissions(
  db: DbTransaction,
  users: SeededUsers,
  questions: SeededQuestions["all"],
): Promise<SeededSubmissions> {
  logSection("Submissions");

  const learner1 = users.learners[0].id;
  const learner2 = users.learners[1].id;
  const instructor = users.instructors[0].id;

  const readingQ = findQuestion(questions, "reading");
  const listeningQ = findQuestion(questions, "listening");
  const writingQ = findQuestion(questions, "writing");
  const speakingQ = findQuestion(questions, "speaking");

  const seeds: SubmissionSeed[] = [
    // Learner 1 — 7 submissions
    {
      submission: {
        userId: learner1,
        questionId: readingQ,
        skill: "reading",
        status: "completed",
        score: 8.0,
        band: "B2",
        gradingMode: "auto",
        completedAt: new Date("2026-01-10T10:00:00Z").toISOString(),
      },
      answer: objectiveAnswer(10),
      result: autoGradeResult(8, 10, 8.0, "B2"),
    },
    {
      submission: {
        userId: learner1,
        questionId: readingQ,
        skill: "reading",
        status: "completed",
        score: 6.0,
        band: "B2",
        gradingMode: "auto",
        completedAt: new Date("2026-01-15T10:00:00Z").toISOString(),
      },
      answer: objectiveAnswer(10),
      result: autoGradeResult(6, 10, 6.0, "B2"),
    },
    {
      submission: {
        userId: learner1,
        questionId: listeningQ,
        skill: "listening",
        status: "completed",
        score: 7.0,
        band: "B2",
        gradingMode: "auto",
        completedAt: new Date("2026-01-12T10:00:00Z").toISOString(),
      },
      answer: objectiveAnswer(10),
      result: autoGradeResult(7, 10, 7.0, "B2"),
    },
    {
      submission: {
        userId: learner1,
        questionId: writingQ,
        skill: "writing",
        status: "completed",
        score: 6.5,
        band: "B2",
        gradingMode: "auto",
        completedAt: new Date("2026-01-18T10:00:00Z").toISOString(),
      },
      answer: {
        text: "In today's rapidly changing world, education plays a crucial role in shaping the future of society. This essay will discuss the importance of higher education and its impact on personal and professional development.",
      },
      result: aiGradeResult(6.5, "B2", "high"),
    },
    {
      submission: {
        userId: learner1,
        questionId: writingQ,
        skill: "writing",
        status: "review_pending",
        score: 5.0,
        band: "B1",
        gradingMode: "auto",
        reviewPriority: "medium",
        claimedBy: instructor,
        claimedAt: new Date("2026-01-22T09:00:00Z").toISOString(),
      },
      answer: {
        text: "I think technology is very important for education. Many students use computers and phones to learn new things every day.",
      },
      result: aiGradeResult(5.0, "B1", "medium"),
    },
    {
      submission: {
        userId: learner1,
        questionId: speakingQ,
        skill: "speaking",
        status: "review_pending",
        reviewPriority: "high",
      },
      answer: {
        audioUrl: "https://storage.vstep.test/audio/learner1-speaking-01.webm",
        durationSeconds: 120,
      },
      result: aiGradeResult(4.5, "B1", "low"),
    },
    {
      submission: {
        userId: learner1,
        questionId: listeningQ,
        skill: "listening",
        status: "completed",
        score: 5.0,
        band: "B1",
        gradingMode: "auto",
        completedAt: new Date("2026-01-25T10:00:00Z").toISOString(),
      },
      answer: objectiveAnswer(10),
      result: autoGradeResult(5, 10, 5.0, "B1"),
    },
    // Learner 2 — 3 submissions
    {
      submission: {
        userId: learner2,
        questionId: readingQ,
        skill: "reading",
        status: "completed",
        score: 5.0,
        band: "B1",
        gradingMode: "auto",
        completedAt: new Date("2026-01-20T10:00:00Z").toISOString(),
      },
      answer: objectiveAnswer(10),
      result: autoGradeResult(5, 10, 5.0, "B1"),
    },
    {
      submission: {
        userId: learner2,
        questionId: writingQ,
        skill: "writing",
        status: "pending",
      },
      answer: {
        text: "Learning English is very important for my future career. I want to improve my writing skills to pass the VSTEP exam.",
      },
      result: null,
    },
    {
      submission: {
        userId: learner2,
        questionId: readingQ,
        skill: "reading",
        status: "completed",
        score: 4.0,
        band: "B1",
        gradingMode: "auto",
        completedAt: new Date("2026-01-28T10:00:00Z").toISOString(),
      },
      answer: objectiveAnswer(10),
      result: autoGradeResult(4, 10, 4.0, "B1"),
    },
  ];

  const submissionValues = seeds.map((s) => s.submission);
  const inserted = await db
    .insert(table.submissions)
    .values(submissionValues)
    .returning({
      id: table.submissions.id,
      skill: table.submissions.skill,
      userId: table.submissions.userId,
      status: table.submissions.status,
    });

  const detailValues = inserted.map((row, i) => ({
    submissionId: row.id,
    answer: seeds[i].answer,
    result: seeds[i].result,
  }));
  await db.insert(table.submissionDetails).values(detailValues);

  logResult("Submissions", inserted.length);
  logResult("Submission details", detailValues.length);

  return { all: inserted };
}
