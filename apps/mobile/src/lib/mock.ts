// Mock data for all screens — aligned with frontend-v2 direction
// Replace with real API calls in Phase 7

import type {
  Exam,
  ExamSessionWithExam,
  PaginatedResponse,
  ProgressOverview,
  SpiderChart,
  ActivityResponse,
  LearningPathResponse,
  VocabularyTopic,
  VocabularyTopicDetail,
  TopicProgress,
  Notification,
  Submission,
  User,
  OnboardingStatus,
  ClassItem,
  SentenceTopic,
  SentenceTopicDetail,
  SentenceTopicProgress,
} from "@/types/api";

// ─── Helpers ──────────────────────────────────────────────────────

function paginated<T>(items: T[]): PaginatedResponse<T> {
  return { data: items, meta: { page: 1, limit: 20, total: items.length, totalPages: 1 } };
}

function recentActivity(): Record<string, number> {
  const out: Record<string, number> = {};
  const today = new Date();
  for (let i = 1; i <= 90; i++) {
    if (Math.random() > 0.55) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      out[d.toISOString().slice(0, 10)] = Math.max(1, Math.floor(Math.random() ** 2 * 12) + 1);
    }
  }
  return out;
}

// ─── Progress ─────────────────────────────────────────────────────

export const MOCK_PROGRESS: ProgressOverview = {
  skills: [
    { skill: "listening", currentLevel: "A2", targetLevel: "B2", attemptCount: 12, streakCount: 3, streakDirection: "up", scaffoldLevel: "B1" },
    { skill: "reading", currentLevel: "B1", targetLevel: "B2", attemptCount: 8, streakCount: 1, streakDirection: "neutral", scaffoldLevel: "B1" },
    { skill: "writing", currentLevel: "A2", targetLevel: "B2", attemptCount: 5, streakCount: 0, streakDirection: "neutral", scaffoldLevel: "A2" },
    { skill: "speaking", currentLevel: "A2", targetLevel: "B2", attemptCount: 3, streakCount: 0, streakDirection: "neutral", scaffoldLevel: "A2" },
  ],
  goal: {
    id: "goal-1",
    targetBand: "B2",
    deadline: "2026-08-01",
    dailyStudyTimeMinutes: 30,
    currentEstimatedBand: "A2",
    daysRemaining: 120,
    achieved: false,
    onTrack: true,
  },
} as any;

export const MOCK_SPIDER: SpiderChart = {
  skills: {
    listening: { current: 4.5, trend: "improving" },
    reading: { current: 5.2, trend: "stable" },
    writing: { current: 2.8, trend: "improving" },
    speaking: { current: 2.1, trend: "insufficient_data" },
  },
  goal: MOCK_PROGRESS.goal,
  eta: { weeks: null, perSkill: {} },
} as any;

export const MOCK_ACTIVITY: ActivityResponse = {
  activityByDay: recentActivity(),
  totalStudyTimeMinutes: 480,
  totalExercises: 45,
  streak: 7,
} as any;

export const MOCK_LEARNING_PATH: LearningPathResponse = {
  projectedImprovement: "Cải thiện 0.5 band sau 4 tuần",
  totalMinutesPerWeek: 180,
  weeklyPlan: [
    { skill: "listening", currentLevel: "A2", targetLevel: "B1", priority: 1, sessionsPerWeek: 3, estimatedMinutes: 30, recommendedLevel: "B1", focusArea: "Nghe tin tức", weakTopics: [{ id: "t1", name: "Từ vựng học thuật", masteryScore: 35 }] },
    { skill: "reading", currentLevel: "A2", targetLevel: "B1", priority: 2, sessionsPerWeek: 2, estimatedMinutes: 25, recommendedLevel: "B1", focusArea: "Đọc bài báo", weakTopics: [] },
    { skill: "writing", currentLevel: "A1", targetLevel: "B1", priority: 3, sessionsPerWeek: 2, estimatedMinutes: 40, recommendedLevel: "B1", focusArea: "Essay Task 1", weakTopics: [] },
    { skill: "speaking", currentLevel: "A1", targetLevel: "B1", priority: 4, sessionsPerWeek: 2, estimatedMinutes: 30, recommendedLevel: "B1", focusArea: "Part 3 Discussion", weakTopics: [] },
  ],
} as any;

// ─── Exams ────────────────────────────────────────────────────────

export const MOCK_EXAMS: Exam[] = [
  { id: "exam-1", title: "VSTEP Mock Test 1", type: "mock", level: "B1", isActive: true, questionCount: 80, duration: 150, blueprint: { listening: { questionIds: ["q1"] }, reading: { questionIds: ["q2"] }, writing: { questionIds: ["q3"] }, speaking: { questionIds: ["q4"] } } },
  { id: "exam-2", title: "VSTEP Mock Test 2", type: "mock", level: "B2", isActive: true, questionCount: 80, duration: 150, blueprint: { listening: { questionIds: ["q5"] }, reading: { questionIds: ["q6"] }, writing: { questionIds: ["q7"] }, speaking: { questionIds: ["q8"] } } },
  { id: "exam-3", title: "VSTEP Practice B1", type: "practice", level: "B1", isActive: true, questionCount: 40, duration: 60, blueprint: { listening: { questionIds: ["q9"] }, reading: { questionIds: ["q10"] }, writing: { questionIds: [] }, speaking: { questionIds: [] } } },
] as any;

export const MOCK_SESSIONS: ExamSessionWithExam[] = [
  { id: "sess-1", examId: "exam-1", status: "completed", listeningScore: 7.5, readingScore: 6.0, writingScore: 5.5, speakingScore: null, createdAt: "2026-04-10T10:00:00Z", exam: MOCK_EXAMS[0] },
  { id: "sess-2", examId: "exam-2", status: "completed", listeningScore: 6.0, readingScore: 7.0, writingScore: null, speakingScore: null, createdAt: "2026-04-08T14:00:00Z", exam: MOCK_EXAMS[1] },
] as any;

// ─── Vocabulary ───────────────────────────────────────────────────

export const MOCK_VOCAB_TOPICS: VocabularyTopic[] = [
  { id: "vt-1", name: "Gia đình & Bạn bè", wordCount: 25, sortOrder: 1 },
  { id: "vt-2", name: "Giáo dục", wordCount: 30, sortOrder: 2 },
  { id: "vt-3", name: "Sức khỏe", wordCount: 20, sortOrder: 3 },
  { id: "vt-4", name: "Công nghệ", wordCount: 28, sortOrder: 4 },
] as any;

export const MOCK_VOCAB_WORDS = [
  { id: "w1", word: "family", pronunciation: "/ˈfæm.əl.i/", meaning: "gia đình", example: "My family is very supportive.", topicId: "vt-1", sortOrder: 1 },
  { id: "w2", word: "sibling", pronunciation: "/ˈsɪb.lɪŋ/", meaning: "anh chị em", example: "I have two siblings.", topicId: "vt-1", sortOrder: 2 },
  { id: "w3", word: "relative", pronunciation: "/ˈrel.ə.tɪv/", meaning: "họ hàng", example: "We visit our relatives during holidays.", topicId: "vt-1", sortOrder: 3 },
  { id: "w4", word: "childhood", pronunciation: "/ˈtʃaɪld.hʊd/", meaning: "thời thơ ấu", example: "She had a happy childhood.", topicId: "vt-1", sortOrder: 4 },
  { id: "w5", word: "upbringing", pronunciation: "/ˈʌp.brɪŋ.ɪŋ/", meaning: "sự nuôi dạy", example: "His upbringing shaped his character.", topicId: "vt-1", sortOrder: 5 },
];

// ─── Notifications ────────────────────────────────────────────────

export const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "n1", type: "grading_complete", title: "Chấm điểm hoàn tất", body: "Bài Writing của bạn đã được chấm.", readAt: null, createdAt: "2026-04-15T08:00:00Z" },
  { id: "n2", type: "streak_milestone", title: "Chuỗi 7 ngày!", body: "Bạn đã luyện tập 7 ngày liên tiếp.", readAt: "2026-04-14T10:00:00Z", createdAt: "2026-04-14T08:00:00Z" },
] as any;

// ─── Onboarding ───────────────────────────────────────────────────

export const MOCK_ONBOARDING_STATUS: OnboardingStatus = {
  completed: true,
  placement: { source: "self_assess", confidence: "medium", levels: { listening: "A2", reading: "B1", writing: "A2", speaking: "A2" }, estimatedBand: "B1" },
  hasGoal: true,
  needsVerification: false,
} as any;

// ─── User ─────────────────────────────────────────────────────────

export const MOCK_USER: User = {
  id: "mock-user-1",
  email: "demo@vstep.vn",
  fullName: "Nguyễn Phát",
  role: "learner",
  avatarUrl: null,
  createdAt: "2026-01-01T00:00:00Z",
} as any;

// ─── Submissions ──────────────────────────────────────────────────

export const MOCK_SUBMISSIONS: Submission[] = [] as any;

// ─── Classes ──────────────────────────────────────────────────────

export const MOCK_CLASSES: ClassItem[] = [] as any;

// ─── Sentences ────────────────────────────────────────────────────

export const MOCK_SENTENCE_TOPICS: SentenceTopic[] = [] as any;
