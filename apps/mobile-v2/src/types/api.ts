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
  | "session_abandoned"
  | "feedback"
  | "system";
export type PracticeMode = "free" | "shadowing" | "drill" | "guided";

// ============================================================
// Auth
// ============================================================

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  fullName: string | null;
  avatarKey: string | null;
}

export interface Profile {
  id: string;
  nickname: string;
  targetLevel: string;
  targetDeadline: string | null;
  entryLevel: string | null;
  avatarColor: string | null;
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
  };
  stats: {
    totalTests: number;
    minTestsRequired: number;
    totalStudyMinutes: number;
    streak: number;
    longestStreak: number;
  };
  chart: {
    listening: number | null;
    reading: number | null;
    writing: number | null;
    speaking: number | null;
    sampleSize: number;
  } | null;
}

export interface HeatmapEntry {
  date: string;
  minutes: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  todaySessions: number;
  dailyGoal: number;
  lastActiveDate: string | null;
}

// ============================================================
// Exam Sessions
// ============================================================

export interface ExamSessionResult {
  id: string;
  examVersionId: string;
  mode: string;
  isFullTest: boolean;
  status: string;
  startedAt: string;
  submittedAt: string | null;
  scores: Record<Skill, number | null> | null;
}

// ============================================================
// User
// ============================================================

export interface UserProfile {
  id: string;
  email: string;
  fullName: string | null;
  avatarKey: string | null;
  role: string;
}
