// ============================================================
// Enums / Type Aliases
// ============================================================

export type Skill = "listening" | "reading" | "writing" | "speaking";
export type QuestionLevel = "A2" | "B1" | "B2" | "C1";
export type VstepBand = "B1" | "B2" | "C1";
export type ExamStatus = "in_progress" | "submitted" | "completed" | "abandoned";
export type SubmissionStatus = "pending" | "processing" | "completed" | "review_pending" | "failed";
export type ExamType = "practice" | "placement" | "mock";
export type ExamSkill = "listening" | "reading" | "writing" | "speaking" | "mixed";
export type NotificationType =
  | "grading_complete"
  | "goal_achieved"
  | "streak_milestone"
  | "study_reminder"
  | "session_abandoned"
  | "feedback"
  | "system";
export type PracticeMode = "free" | "shadowing" | "drill" | "guided";

// ============================================================
// Auth
// ============================================================

export type AvatarKey =
  | "Alex" | "Jordan" | "Sam" | "Riley" | "Casey" | "Morgan" | "Taylor" | "Drew"
  | "Quinn" | "Avery" | "Blake" | "Cameron" | "Dakota" | "Emery" | "Finley"
  | "Hayden" | "Indigo" | "Jesse" | "Kai" | "Logan" | "Mason" | "Noah"
  | "Oakley" | "Parker" | "Reese" | "Sage" | "Skyler" | "Tatum" | "Winter" | "Zion";

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  fullName: string | null;
  avatarKey: AvatarKey | null;
  avatarUrl: string | null;
  hasPassword: boolean;
}

export interface Profile {
  id: string;
  nickname: string;
  targetLevel: string;
  targetDeadline: string | null;
  entryLevel: string | null;
  avatarColor: string | null;
  avatarKey: AvatarKey | null;
  avatarUrl: string | null;
  isInitialProfile: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: AuthUser;
  profile: Profile | null;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// ============================================================
// Exams
// ============================================================

export interface Exam {
  id: string;
  title: string;
  description: string | null;
  tags: string[];
  totalDurationMinutes: number;
  type: ExamType;
  skill: ExamSkill;
  status?: ExamStatus;
  bestScore?: number | null;
  attemptCount?: number;
}

export interface ExamSession {
  id: string;
  examId: string;
  userId: string;
  status: ExamStatus;
  startedAt: string;
  submittedAt: string | null;
  answers: Record<string, string>;
}

export interface ExamVersionListeningSection {
  id: string;
  part: number;
  partTitle: string;
  durationMinutes: number;
  audioUrl: string;
  transcript: string | null;
  displayOrder: number;
  items: ExamVersionMcqItem[];
}

export interface ExamVersionMcqItem {
  id: string;
  displayOrder: number;
  stem: string;
  options: [string, string, string, string];
  correctIndex: number;
}

export interface ExamVersionReadingPassage {
  id: string;
  part: number;
  title: string;
  durationMinutes: number;
  passage: string;
  displayOrder: number;
  items: ExamVersionMcqItem[];
}

export interface ExamVersionWritingTask {
  id: string;
  part: number;
  taskType: string;
  durationMinutes: number;
  prompt: string;
  minWords: number;
  displayOrder: number;
}

export interface ExamVersionSpeakingPart {
  id: string;
  part: number;
  type: string;
  durationMinutes: number;
  displayOrder: number;
}

export interface ExamVersion {
  id: string;
  versionNumber: number;
  isActive: boolean;
  publishedAt: string;
  listeningSections: ExamVersionListeningSection[];
  readingPassages: ExamVersionReadingPassage[];
  writingTasks: ExamVersionWritingTask[];
  speakingParts: ExamVersionSpeakingPart[];
}

export interface ExamDetail {
  exam: Exam;
  version: ExamVersion;
}

// ============================================================
// Practice / Vocab
// ============================================================

export interface VocabCard {
  id: string;
  word: string;
  definition: string;
  example: string | null;
  phonetic: string | null;
  topic: string;
  difficulty: QuestionLevel;
  nextReview: string | null;
  interval: number;
  easeFactor: number;
}

export interface VocabTopic {
  id: string;
  name: string;
  cardCount: number;
  dueCount: number;
  color: string;
}

// ============================================================
// Submissions / Grading
// ============================================================

export interface Submission {
  id: string;
  examId: string;
  examTitle: string;
  userId: string;
  skill: ExamSkill;
  status: SubmissionStatus;
  score: number | null;
  totalScore: number | null;
  band: string | null;
  feedback: string | null;
  createdAt: string;
  gradedAt: string | null;
}

// ============================================================
// Progress / Stats
// ============================================================

export interface OverviewData {
  profile: {
    nickname: string;
    targetLevel: string;
    targetDeadline: string | null;
    daysUntilExam: number | null;
    entryLevel: string | null;
    predictedLevel: string | null;
  };
  streak: {
    current: number;
    longest: number;
    lastActiveDate: string | null;
    todayActive: boolean;
  };
  heatmap: {
    weeks: number;
    days: SkillActivityDay[];
  };
  scores: {
    spider: ScoreSpider | null;
    timeline: ScoreTimelinePoint[];
    growth: Record<Skill, ScoreGrowth>;
  };
  stats: {
    totalTests: number;
    totalStudyMinutes: number;
  };
}

export interface ScoreSpider {
  listening: number | null;
  reading: number | null;
  writing: number | null;
  speaking: number | null;
  sampleSize: number;
}

export interface ScoreTimelinePoint {
  date: string;
  listening: number | null;
  reading: number | null;
  writing: number | null;
  speaking: number | null;
}

export interface ScoreGrowth {
  first: number | null;
  latest: number | null;
  change: number | null;
  trend: string;
}

export interface SkillActivityDay {
  date: string;
  listening: number;
  reading: number;
  writing: number;
  speaking: number;
  vocab: number;
  exam: number;
}

export type HeatmapEntry = SkillActivityDay;

export interface StreakData {
  current: number;
  longest: number;
  todayActive: boolean;
  dailyGoal: number;
  lastActiveDate: string | null;
  milestones: StreakMilestone[];
}

export interface StreakMilestone {
  days: number;
  coins: number;
  claimed: boolean;
  claimedAt: string | null;
}

export interface LearningPathSkill {
  skill: Skill | "vocabulary" | "grammar";
  level: string;
  band: number | null;
  coveragePct: number | null;
  totalItems: number | null;
  completedItems: number | null;
  suggestion: string | null;
}

export interface LearningPathData {
  currentLevel: string;
  targetLevel: string;
  daysRemaining: number | null;
  skills: LearningPathSkill[];
}

// ============================================================
// Exam Sessions
// ============================================================

export interface ExamSessionResult {
  id: string;
  examId: string;
  examVersionId: string;
  mode: string;
  isFullTest: boolean;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  serverDeadlineAt: string;
  scores: Record<Skill, number | null> | null;
}

// ============================================================
// User
// ============================================================

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  avatarKey: AvatarKey | null;
  avatarUrl: string | null;
  role: string;
}
