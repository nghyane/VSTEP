// Auth
export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  role: "learner" | "instructor" | "admin";
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface RegisterResponse {
  user: AuthUser;
  message: string;
}

// Pagination
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

// Exams
export type Skill = "listening" | "reading" | "writing" | "speaking";
export type QuestionLevel = "A2" | "B1" | "B2" | "C1";
export type VstepBand = "A1" | "A2" | "B1" | "B2" | "C1";

export interface ExamBlueprint {
  listening?: { questionIds: string[] };
  reading?: { questionIds: string[] };
  writing?: { questionIds: string[] };
  speaking?: { questionIds: string[] };
  durationMinutes: number;
}

export interface Exam {
  id: string;
  level: QuestionLevel;
  blueprint: ExamBlueprint;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExamSession {
  id: string;
  userId: string;
  examId: string;
  status: "in_progress" | "submitted" | "completed" | "abandoned";
  listeningScore: number | null;
  readingScore: number | null;
  writingScore: number | null;
  speakingScore: number | null;
  overallScore: number | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// Progress
export type StreakDirection = "up" | "down" | "neutral";
export type Trend = "improving" | "stable" | "declining" | "inconsistent" | "insufficient_data";

export interface SkillProgress {
  id: string;
  userId: string;
  skill: Skill;
  currentLevel: VstepBand | null;
  targetLevel: VstepBand | null;
  scaffoldLevel: number;
  streakCount: number;
  streakDirection: StreakDirection;
  attemptCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  userId: string;
  targetBand: VstepBand;
  currentEstimatedBand: VstepBand | null;
  deadline: string;
  dailyStudyTimeMinutes: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressOverview {
  skills: SkillProgress[];
  goal: Goal | null;
}

export interface SpiderChartSkill {
  current: number;
  trend: Trend;
}

export interface SpiderChartResponse {
  skills: Record<Skill, SpiderChartSkill>;
  goal: Goal | null;
  eta: {
    weeks: number | null;
    perSkill: Record<Skill, number | null>;
  };
}

export interface ProgressRecentScore {
  score: number;
  createdAt: string;
}

export interface ProgressSkillDetail {
  progress: SkillProgress | null;
  recentScores: ProgressRecentScore[];
  windowAvg: number | null;
  windowDeviation: number | null;
  trend: Trend;
  eta: number | null;
}

// Answer types
export interface ObjectiveAnswer {
  answers: Record<string, string>;
}

export interface WritingAnswer {
  text: string;
}

export interface SpeakingAnswer {
  audioUrl: string;
  durationSeconds: number;
  transcript?: string;
}

export type SubmissionAnswer = ObjectiveAnswer | WritingAnswer | SpeakingAnswer;

// User
export interface User {
  id: string;
  email: string;
  fullName: string | null;
  role: "learner" | "instructor" | "admin";
  createdAt: string;
  updatedAt: string;
}

// Submissions
export type SubmissionStatus = "pending" | "processing" | "completed" | "review_pending" | "failed";

export interface Submission {
  id: string;
  userId: string;
  questionId: string;
  skill: Skill;
  status: SubmissionStatus;
  score: number | null;
  band: VstepBand | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface SubmissionFull extends Submission {
  answer: SubmissionAnswer | null;
  result: Record<string, unknown> | null;
  feedback: string | null;
}

// Questions
export interface QuestionItem {
  stem: string;
  options: string[];
}

export interface ListeningContent {
  audioUrl: string;
  transcript?: string;
  items: QuestionItem[];
}

export interface ReadingContent {
  passage: string;
  title?: string;
  items: QuestionItem[];
}

export interface WritingContent {
  prompt: string;
  taskType: "letter" | "essay";
  instructions?: string;
  minWords?: number;
  requiredPoints?: string[];
}

export interface SpeakingPart1Content {
  topics: { name: string; questions: string[] }[];
}

export interface SpeakingPart2Content {
  situation: string;
  options: string[];
  preparationSeconds: number;
  speakingSeconds: number;
}

export interface SpeakingPart3Content {
  centralIdea: string;
  suggestions: string[];
  followUpQuestion: string;
  preparationSeconds: number;
  speakingSeconds: number;
}

export type QuestionContent =
  | ListeningContent
  | ReadingContent
  | WritingContent
  | SpeakingPart1Content
  | SpeakingPart2Content
  | SpeakingPart3Content;

export interface Question {
  id: string;
  skill: Skill;
  part: number;
  content: QuestionContent;
  answerKey?: Record<string, string> | null;
  explanation?: string | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

// Classes
export interface Class {
  id: string;
  name: string;
  description: string | null;
  inviteCode: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassMember {
  id: string;
  classId: string;
  userId: string;
  joinedAt: string;
  removedAt: string | null;
  user?: { id: string; email: string; fullName: string | null };
}

export interface InstructorFeedback {
  id: string;
  classId: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  skill: Skill | null;
  submissionId: string | null;
  createdAt: string;
  fromUser?: { fullName: string | null; email: string };
}
