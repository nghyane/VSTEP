import type { DbTransaction } from "../../src/db/index";
import { table } from "../../src/db/schema/index";
import type {
  NewUserGoal,
  NewUserKnowledgeProgress,
  NewUserProgress,
  NewUserSkillScore,
} from "../../src/db/schema/progress";
import { logResult, logSection } from "../utils";
import type { SeededUsers } from "./01-users";
import type { SeededSubmissions } from "./05-submissions";
import type { SeededKnowledgePoints } from "./08-knowledge-points";

export async function seedProgress(
  db: DbTransaction,
  users: SeededUsers,
  submissions: SeededSubmissions,
  knowledgePoints: SeededKnowledgePoints,
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

  // User knowledge progress: learners' mastery of specific knowledge points
  const grammarKPs = knowledgePoints.all.filter(
    (kp) => kp.category === "grammar",
  );
  const vocabKPs = knowledgePoints.all.filter(
    (kp) => kp.category === "vocabulary",
  );
  const strategyKPs = knowledgePoints.all.filter(
    (kp) => kp.category === "strategy",
  );

  const knowledgeProgressData: NewUserKnowledgeProgress[] = [
    // Learner 1 — has practiced more, varied mastery
    {
      userId: learner1,
      knowledgePointId: grammarKPs[0].id, // Tenses
      masteryScore: 0.82,
      totalAttempted: 15,
      totalCorrect: 12,
    },
    {
      userId: learner1,
      knowledgePointId: grammarKPs[1].id, // Passive Voice
      masteryScore: 0.6,
      totalAttempted: 10,
      totalCorrect: 6,
    },
    {
      userId: learner1,
      knowledgePointId: grammarKPs[3].id, // Relative Clauses
      masteryScore: 0.45,
      totalAttempted: 8,
      totalCorrect: 4,
    },
    {
      userId: learner1,
      knowledgePointId: vocabKPs[0].id, // Academic Vocabulary
      masteryScore: 0.75,
      totalAttempted: 20,
      totalCorrect: 15,
    },
    {
      userId: learner1,
      knowledgePointId: vocabKPs[2].id, // Synonyms and Antonyms
      masteryScore: 0.7,
      totalAttempted: 10,
      totalCorrect: 7,
    },
    {
      userId: learner1,
      knowledgePointId: vocabKPs[4].id, // Context Clue Vocabulary
      masteryScore: 0.85,
      totalAttempted: 12,
      totalCorrect: 10,
    },
    {
      userId: learner1,
      knowledgePointId: strategyKPs[0].id, // Skimming for Main Idea
      masteryScore: 0.9,
      totalAttempted: 18,
      totalCorrect: 16,
    },
    {
      userId: learner1,
      knowledgePointId: strategyKPs[2].id, // Inference and Implication
      masteryScore: 0.55,
      totalAttempted: 12,
      totalCorrect: 7,
    },
    // Learner 2 — newer user, fewer attempts
    {
      userId: learner2,
      knowledgePointId: grammarKPs[0].id, // Tenses
      masteryScore: 0.5,
      totalAttempted: 6,
      totalCorrect: 3,
    },
    {
      userId: learner2,
      knowledgePointId: vocabKPs[0].id, // Academic Vocabulary
      masteryScore: 0.4,
      totalAttempted: 5,
      totalCorrect: 2,
    },
    {
      userId: learner2,
      knowledgePointId: strategyKPs[0].id, // Skimming for Main Idea
      masteryScore: 0.6,
      totalAttempted: 5,
      totalCorrect: 3,
    },
    {
      userId: learner2,
      knowledgePointId: strategyKPs[1].id, // Scanning for Specific Info
      masteryScore: 0.33,
      totalAttempted: 3,
      totalCorrect: 1,
    },
  ];

  await db.insert(table.userKnowledgeProgress).values(knowledgeProgressData);
  logResult("User knowledge progress", knowledgeProgressData.length);
}
