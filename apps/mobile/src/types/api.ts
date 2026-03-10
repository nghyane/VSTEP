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
export type NotificationType = "grading_completed" | "feedback_received" | "class_invite" | "goal_achieved" | "system";

// ============================================================
// Auth
// ============================================================

export interface AuthUser {
  id: string;
  email: string;
  role: string;
  fullName: string | null;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// ============================================================
// Pagination
// ============================================================

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ============================================================
// User
// ============================================================

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  avatarKey: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Exams
// ============================================================

export type ExamBlueprint = Record<string, { questionIds: string[] } | undefined>;

export interface Exam {
  id: string;
  level: QuestionLevel;
  title: string;
  description: string | null;
  type: ExamType;
  skill: ExamSkill | null;
  durationMinutes: number | null;
  blueprint: ExamBlueprint;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Exam Sessions
// ============================================================

export interface ExamSession {
  id: string;
  userId: string;
  examId: string;
  status: ExamStatus;
  listeningScore: number | null;
  readingScore: number | null;
  writingScore: number | null;
  speakingScore: number | null;
  overallScore: number | null;
  overallBand: VstepBand | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExamSessionWithExam extends ExamSession {
  exam: { title: string; level: QuestionLevel; type: ExamType } | null;
}

export interface SessionQuestion {
  id: string;
  skill: Skill;
  part: number;
  content: unknown;
}

export interface SessionAnswer {
  questionId: string;
  answer: unknown;
}

export interface ExamSessionDetail extends ExamSession {
  questions: SessionQuestion[];
  answers: SessionAnswer[];
}

// ============================================================
// Questions
// ============================================================

export interface Question {
  id: string;
  skill: Skill;
  level: QuestionLevel;
  part: number;
  content: unknown;
  answerKey: unknown | null;
  explanation: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Submissions
// ============================================================

export interface Submission {
  id: string;
  userId: string;
  questionId: string;
  skill: Skill;
  status: SubmissionStatus;
  score: number | null;
  band: VstepBand | null;
  part: number | null;
  answer: unknown | null;
  result: unknown | null;
  feedback: string | null;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// Progress
// ============================================================

export interface SkillProgress {
  id: string;
  userId: string;
  skill: Skill;
  currentLevel: QuestionLevel;
  scaffoldLevel: number;
  streakCount: number;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  targetBand: VstepBand;
  currentEstimatedBand: VstepBand | null;
  deadline: string | null;
  dailyStudyTimeMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EnrichedGoal extends Goal {
  achieved: boolean;
  onTrack: boolean | null;
  daysRemaining: number | null;
}

export interface ProgressOverview {
  skills: SkillProgress[];
  goal: EnrichedGoal | null;
}

// ============================================================
// Spider Chart
// ============================================================

export interface SpiderChartSkill {
  current: number;
  trend: string;
}

export interface SpiderChart {
  skills: Record<string, SpiderChartSkill>;
  goal: Goal | null;
  eta: {
    weeks: number | null;
    perSkill: Record<string, number | null>;
  };
}

// ============================================================
// Skill Detail
// ============================================================

export interface SkillDetail {
  progress: SkillProgress | null;
  recentScores: { score: number; createdAt: string }[];
  windowAvg: number | null;
  windowDeviation: number | null;
  trend: "improving" | "stable" | "declining" | "inconsistent" | "insufficient_data";
  eta: number | null;
}

// ============================================================
// Activity
// ============================================================

export interface ActivityResponse {
  streak: number;
  total: number;
  activeDays: string[];
  totalExercises: number;
  totalStudyTimeMinutes: number;
}

// ============================================================
// Learning Path
// ============================================================

export interface LearningPathSkill {
  skill: string;
  currentLevel: string;
  targetLevel: string;
  sessionsPerWeek: number;
  focusArea: string | null;
  recommendedLevel: string;
  estimatedMinutes: number;
  weakTopics: { id: string; name: string; masteryScore: number }[];
  priority: number;
}

export interface LearningPathResponse {
  weeklyPlan: LearningPathSkill[];
  totalMinutesPerWeek: number;
  projectedImprovement: string | null;
}

// ============================================================
// Practice
// ============================================================

export interface PracticeQuestion {
  id: string;
  skill: string;
  level: string;
  part: number;
  content: unknown;
  answerKey: unknown | null;
  explanation: string | null;
}

export interface PracticeNextResponse {
  question: PracticeQuestion | null;
  scaffoldLevel: number;
  currentLevel: string;
}

// ============================================================
// Notifications
// ============================================================

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  data: unknown | null;
  readAt: string | null;
  createdAt: string;
}

// ============================================================
// Vocabulary
// ============================================================

export interface VocabularyTopic {
  id: string;
  name: string;
  description: string;
  iconKey: string | null;
  wordCount: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyWord {
  id: string;
  word: string;
  phonetic: string | null;
  audioUrl: string | null;
  partOfSpeech: string;
  definition: string;
  explanation: string;
  examples: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface VocabularyTopicDetail extends Omit<VocabularyTopic, "wordCount"> {
  words: VocabularyWord[];
}

export interface TopicProgress {
  knownWordIds: string[];
  totalWords: number;
  knownCount: number;
}

// ============================================================
// Onboarding
// ============================================================

export interface OnboardingStatus {
  completed: boolean;
  placement: {
    source: string;
    confidence: string;
    levels: {
      listening: QuestionLevel;
      reading: QuestionLevel;
      writing: QuestionLevel;
      speaking: QuestionLevel;
    };
    estimatedBand: VstepBand | null;
  } | null;
  hasGoal: boolean;
  needsVerification: boolean;
}

export interface PlacementResult {
  source: string;
  confidence: string;
  levels: {
    listening: QuestionLevel;
    reading: QuestionLevel;
    writing: QuestionLevel;
    speaking: QuestionLevel;
  };
  estimatedBand: VstepBand | null;
  weakPoints: { skill: string; category: string; name: string }[];
  needsVerification: boolean;
}

export interface PlacementStarted {
  sessionId: string;
  examId: string;
  questionCount: number;
}

// ============================================================
// Classes
// ============================================================

export interface ClassItem {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  createdBy: string;
  maxMembers: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ClassMember {
  userId: string;
  role: string;
  joinedAt: string;
  user?: { id: string; fullName: string | null; email: string };
}

export interface ClassDetail extends ClassItem {
  members: ClassMember[];
  memberCount: number;
}

export interface ClassFeedback {
  id: string;
  classId: string;
  userId: string;
  instructorId: string;
  content: string;
  createdAt: string;
}
