import type { DbTransaction } from "../../src/db/index";
import { table } from "../../src/db/schema/index";
import type {
  NewUserGoal,
  NewUserProgress,
  NewUserSkillScore,
} from "../../src/db/schema/progress";
import { logResult, logSection } from "../utils";
import type { SeededUsers } from "./01-users";
import type { SeededSubmissions } from "./05-submissions";

export async function seedProgress(
  db: DbTransaction,
  users: SeededUsers,
  submissions: SeededSubmissions,
): Promise<void> {
  logSection("Progress");

  const learner1 = users.learners[0].id;
  const learner2 = users.learners[1].id;

  // User progress: 2 learners × 4 skills = 8 records
  const progressData: NewUserProgress[] = [
    // Learner 1
    {
      userId: learner1,
      skill: "reading",
      currentLevel: "B2",
      scaffoldLevel: 2,
      streakCount: 3,
      streakDirection: "up",
      attemptCount: 5,
    },
    {
      userId: learner1,
      skill: "listening",
      currentLevel: "B1",
      scaffoldLevel: 1,
      streakCount: 1,
      streakDirection: "up",
      attemptCount: 3,
    },
    {
      userId: learner1,
      skill: "writing",
      currentLevel: "B1",
      scaffoldLevel: 1,
      streakCount: 2,
      streakDirection: "neutral",
      attemptCount: 4,
    },
    {
      userId: learner1,
      skill: "speaking",
      currentLevel: "B1",
      scaffoldLevel: 1,
      streakCount: 0,
      streakDirection: "neutral",
      attemptCount: 2,
    },
    // Learner 2
    {
      userId: learner2,
      skill: "reading",
      currentLevel: "B1",
      scaffoldLevel: 1,
      streakCount: 1,
      streakDirection: "up",
      attemptCount: 2,
    },
    {
      userId: learner2,
      skill: "listening",
      currentLevel: "A2",
      scaffoldLevel: 1,
      streakCount: 0,
      streakDirection: "neutral",
      attemptCount: 1,
    },
    {
      userId: learner2,
      skill: "writing",
      currentLevel: "A2",
      scaffoldLevel: 1,
      streakCount: 0,
      streakDirection: "neutral",
      attemptCount: 1,
    },
    {
      userId: learner2,
      skill: "speaking",
      currentLevel: "A2",
      scaffoldLevel: 1,
      streakCount: 0,
      streakDirection: "neutral",
      attemptCount: 0,
    },
  ];

  await db.insert(table.userProgress).values(progressData);
  logResult("User progress", progressData.length);

  // Skill scores: staggered dates showing improvement for learner 1
  // Find submission IDs for linking
  const l1ReadingSubs = submissions.all.filter(
    (s) => s.userId === learner1 && s.skill === "reading",
  );
  const l1ListeningSubs = submissions.all.filter(
    (s) => s.userId === learner1 && s.skill === "listening",
  );
  const l1WritingSubs = submissions.all.filter(
    (s) => s.userId === learner1 && s.skill === "writing",
  );
  const _l1SpeakingSubs = submissions.all.filter(
    (s) => s.userId === learner1 && s.skill === "speaking",
  );
  const l2ReadingSubs = submissions.all.filter(
    (s) => s.userId === learner2 && s.skill === "reading",
  );

  const skillScoreData: NewUserSkillScore[] = [
    // Learner 1 — Reading (4 scores, improving trend)
    {
      userId: learner1,
      skill: "reading",
      score: 5.0,
      submissionId: l1ReadingSubs[0]?.id,
      createdAt: new Date("2025-12-01T10:00:00Z").toISOString(),
    },
    {
      userId: learner1,
      skill: "reading",
      score: 6.0,
      submissionId: l1ReadingSubs[1]?.id,
      createdAt: new Date("2025-12-15T10:00:00Z").toISOString(),
    },
    {
      userId: learner1,
      skill: "reading",
      score: 7.0,
      createdAt: new Date("2026-01-05T10:00:00Z").toISOString(),
    },
    {
      userId: learner1,
      skill: "reading",
      score: 8.0,
      createdAt: new Date("2026-01-15T10:00:00Z").toISOString(),
    },
    // Learner 1 — Listening (4 scores)
    {
      userId: learner1,
      skill: "listening",
      score: 4.0,
      createdAt: new Date("2025-12-05T10:00:00Z").toISOString(),
    },
    {
      userId: learner1,
      skill: "listening",
      score: 5.0,
      submissionId: l1ListeningSubs[0]?.id,
      createdAt: new Date("2025-12-20T10:00:00Z").toISOString(),
    },
    {
      userId: learner1,
      skill: "listening",
      score: 6.0,
      createdAt: new Date("2026-01-10T10:00:00Z").toISOString(),
    },
    {
      userId: learner1,
      skill: "listening",
      score: 7.0,
      submissionId: l1ListeningSubs[1]?.id,
      createdAt: new Date("2026-01-25T10:00:00Z").toISOString(),
    },
    // Learner 1 — Writing (4 scores)
    {
      userId: learner1,
      skill: "writing",
      score: 4.5,
      createdAt: new Date("2025-12-10T10:00:00Z").toISOString(),
    },
    {
      userId: learner1,
      skill: "writing",
      score: 5.0,
      submissionId: l1WritingSubs[0]?.id,
      createdAt: new Date("2026-01-01T10:00:00Z").toISOString(),
    },
    {
      userId: learner1,
      skill: "writing",
      score: 5.5,
      createdAt: new Date("2026-01-12T10:00:00Z").toISOString(),
    },
    {
      userId: learner1,
      skill: "writing",
      score: 6.5,
      submissionId: l1WritingSubs[1]?.id,
      createdAt: new Date("2026-01-20T10:00:00Z").toISOString(),
    },
    // Learner 1 — Speaking (2 scores)
    {
      userId: learner1,
      skill: "speaking",
      score: 4.0,
      createdAt: new Date("2026-01-08T10:00:00Z").toISOString(),
    },
    {
      userId: learner1,
      skill: "speaking",
      score: 4.5,
      createdAt: new Date("2026-01-22T10:00:00Z").toISOString(),
    },
    // Learner 2 — Reading (2 scores)
    {
      userId: learner2,
      skill: "reading",
      score: 4.0,
      submissionId: l2ReadingSubs[0]?.id,
      createdAt: new Date("2026-01-15T10:00:00Z").toISOString(),
    },
    {
      userId: learner2,
      skill: "reading",
      score: 5.0,
      submissionId: l2ReadingSubs[1]?.id,
      createdAt: new Date("2026-01-28T10:00:00Z").toISOString(),
    },
  ];

  await db.insert(table.userSkillScores).values(skillScoreData);
  logResult("User skill scores", skillScoreData.length);

  // User goals
  const goalData: NewUserGoal[] = [
    {
      userId: learner1,
      targetBand: "B2",
      currentEstimatedBand: "B1",
      deadline: new Date("2026-05-15T00:00:00Z").toISOString(),
      dailyStudyTimeMinutes: 45,
    },
    {
      userId: learner2,
      targetBand: "B1",
      currentEstimatedBand: "A2",
      deadline: new Date("2026-08-15T00:00:00Z").toISOString(),
      dailyStudyTimeMinutes: 30,
    },
  ];

  await db.insert(table.userGoals).values(goalData);
  logResult("User goals", goalData.length);
}
