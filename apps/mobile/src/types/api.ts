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
export type NotificationType = "grading_complete" | "goal_achieved" | "streak_milestone" | "session_abandoned" | "feedback" | "class_invite" | "system";
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
}

export interface AuthResponse {
  user: AuthUser;
  profile: Profile | null;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
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

export interface ExamSection {
  skill: Skill | null;
  part: number;
  sectionType: "objective_group" | "writing_task" | "speaking_part";
  title: string | null;
  instructions: string | null;
  objectiveItemCount: number;
  entryCount: number;
  bankEntryIds: string[];
  questionCount: number;
  questionIds: string[];
  order: number;
}

export interface Exam {
  id: string;
  level: QuestionLevel;
  title: string;
  description: string | null;
  type: ExamType;
  skill: ExamSkill | null;
  durationMinutes: number | null;
  blueprint: ExamBlueprint;
  sections: ExamSection[];
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
  submissions: Submission[];
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

export interface AnnotationHighlight {
  phrase: string;
  note: string;
  type: "structure" | "collocation" | "transition";
}

export interface AnnotationCorrection {
  original: string;
  correction: string;
  type: "grammar" | "vocabulary" | "spelling";
  explanation: string;
}

export interface AnnotationRewrite {
  original: string;
  correction: string;
  note: string;
}

export interface GradingAnnotations {
  strengthQuotes: AnnotationHighlight[];
  corrections: AnnotationCorrection[];
  rewriteSuggestion: AnnotationRewrite | null;
}

export interface GradingResult {
  type: string;
  overallScore?: number;
  band?: VstepBand;
  criteriaScores?: Record<string, number>;
  criteria?: { key: string; name: string; score: number; bandLabel: string }[];
  feedback?: string;
  annotations?: GradingAnnotations;
  knowledgeGaps?: { name: string; category: string }[];
  pronunciation?: {
    transcript: string;
    accuracyScore: number;
    fluencyScore: number;
    prosodyScore: number;
    wordErrors?: { word: string; errorType: string; accuracyScore: number }[];
  };
  confidence?: "high" | "medium" | "low";
  gradedAt?: string;
  scaffoldingType?: string;
  correct?: number;
  total?: number;
  rawRatio?: number;
  allCorrect?: boolean;
  userAnswers?: Record<string, string | null>;
  correctAnswers?: Record<string, string | null>;
  items?: ObjectiveItemResult[];
}

export interface ObjectiveItemResult {
  questionNumber: number;
  userAnswer: string | null;
  correctAnswer: string | null;
  isCorrect: boolean;
}

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
  result: GradingResult | null;
  feedback: string | null;
  question?: Question;
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
// Practice (session-based adaptive)
// ============================================================

export interface PracticeSession {
  id: string;
  skill: Skill;
  mode: PracticeMode;
  level: QuestionLevel;
  config: {
    itemsCount: number;
    focusKp: string | null;
    writingTier?: WritingTier;
  };
  currentQuestionId: string | null;
  summary: PracticeSummary | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PracticeSummary {
  itemsCompleted: number;
  itemsTotal: number;
  averageScore: number | null;
  bestScore: number | null;
  scoresPending: boolean;
  items: {
    questionId: string;
    topic: string | null;
    bestScore: number | null;
    attempts: number;
    status: string;
  }[];
  weakPoints: Record<string, number>;
  improvement: number | null;
}

// ── Writing Scaffold types ───────────────────────────────────────

export type WritingTier = 1 | 2 | 3;
export type WritingScaffoldType = "template" | "guided" | "freeform";

export interface WritingScaffoldBlankHints {
  b1: string[];
  b2: string[];
}

export interface WritingScaffoldPart {
  type: "text" | "blank";
  content?: string;
  id?: string;
  label?: string;
  variant?: "transition" | "content";
  hints?: WritingScaffoldBlankHints;
}

export interface WritingScaffoldSection {
  title: string;
  parts: WritingScaffoldPart[];
}

export interface WritingTemplatePayload {
  sections: WritingScaffoldSection[];
}

export interface WritingGuidedPayload {
  outline: string[];
  starters: string[];
  wordCount: string;
}

export interface WritingScaffold {
  questionId: string;
  tier: WritingTier;
  requestedTier?: WritingTier;
  effectiveTier?: WritingTier;
  type: WritingScaffoldType;
  payload: WritingTemplatePayload | WritingGuidedPayload | null;
  fallbackReason?: "template_unavailable" | null;
}

export interface PracticeCurrentItem {
  question: Question;
  difficulty: QuestionLevel;
  isReview: boolean;
  referenceText?: string;
  referenceAudioPath?: string;
  targetText?: string;
  writingScaffold?: WritingScaffold;
}

export interface PracticeProgress {
  current: number;
  total: number;
  hasMore: boolean;
}

export interface PracticeStartResponse {
  session: PracticeSession;
  currentItem: PracticeCurrentItem | null;
  recommendation: unknown;
  progress: PracticeProgress;
}

export interface PracticeShowResponse {
  session: PracticeSession;
  currentItem: PracticeCurrentItem | null;
  progress: PracticeProgress | null;
}

export interface PracticeSubmitResult {
  result: GradingResult | null;
  submissionId: string;
  canRetry: boolean;
  isRetry: boolean;
  previousScore: number | null;
  improvement: number | null;
  attemptNumber: number;
  currentItem: PracticeCurrentItem | null;
  progress: PracticeProgress;
}

// ============================================================
// Uploads (presigned URL flow)
// ============================================================

export interface PresignResponse {
  uploadUrl: string;
  headers: Record<string, string>;
  audioPath: string;
  expiresIn: number;
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
// Sentences
// ============================================================

export interface SentenceTopic {
  id: string;
  name: string;
  description: string;
  iconKey: string | null;
  sentenceCount: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SentenceItem {
  id: string;
  topicId: string;
  sentence: string;
  audioUrl: string | null;
  translation: string;
  explanation: string;
  writingUsage: string;
  difficulty: "easy" | "medium" | "hard";
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface SentenceTopicDetail {
  id: string;
  name: string;
  description: string;
  iconKey: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  sentences: SentenceItem[];
}

export interface SentenceTopicProgress {
  masteredSentenceIds: string[];
  totalSentences: number;
  masteredCount: number;
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
  instructorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ClassMember {
  id: string;
  userId: string;
  fullName: string | null;
  email: string;
  joinedAt: string;
}

export interface ClassDetail extends Omit<ClassItem, "inviteCode"> {
  inviteCode: string | null;
  members: ClassMember[];
  memberCount: number;
}

export interface ClassFeedback {
  id: string;
  classId: string;
  fromUserId: string;
  fromUserName: string | null;
  toUserId: string;
  toUserName: string | null;
  content: string;
  skill: string | null;
  submissionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClassAssignment {
  id: string;
  classroomId: string;
  title: string;
  description: string | null;
  content: string | null;
  skill: string | null;
  type: "practice" | "exam";
  dueDate: string | null;
  allowRetry: boolean;
  createdAt: string;
  submissionCount?: number;
  gradedCount?: number;
  submittedCount?: number;
  pendingCount?: number;
  submissions?: ClassAssignmentSubmission[];
}

export interface ClassAssignmentSubmission {
  id: string;
  assignmentId: string;
  userId: string;
  fullName: string | null;
  email: string | null;
  answer: string | null;
  status: "pending" | "submitted" | "graded";
  score: string | null;
  feedback: string | null;
  submittedAt: string | null;
  lateMinutes: number | null;
  createdAt: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  fullName: string;
  avgScore: number;
  totalAttempts: number;
  streak: number;
}
