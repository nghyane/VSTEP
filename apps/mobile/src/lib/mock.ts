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
  { id: "exam-1", title: "Đề thi VSTEP HNUE 08/02/2026 #1", type: "mock", level: "B1", isActive: true, questionCount: 80, duration: 150, blueprint: { listening: { questionIds: ["q1"] }, reading: { questionIds: ["q2"] }, writing: { questionIds: ["q3"] }, speaking: { questionIds: ["q4"] } } },
  { id: "exam-2", title: "Đề thi VSTEP HNUE 08/02/2026 #2", type: "mock", level: "B2", isActive: true, questionCount: 80, duration: 150, blueprint: { listening: { questionIds: ["q5"] }, reading: { questionIds: ["q6"] }, writing: { questionIds: ["q7"] }, speaking: { questionIds: ["q8"] } } },
  { id: "exam-3", title: "Đề thi VSTEP ĐHQG 15/03/2026 #3", type: "mock", level: "B1", isActive: true, questionCount: 80, duration: 150, blueprint: { listening: { questionIds: ["q9"] }, reading: { questionIds: ["q10"] }, writing: { questionIds: ["q11"] }, speaking: { questionIds: ["q12"] } } },
  { id: "exam-4", title: "Đề thi VSTEP ĐHQG 15/03/2026 #4", type: "mock", level: "B2", isActive: true, questionCount: 80, duration: 150, blueprint: { listening: { questionIds: ["q13"] }, reading: { questionIds: ["q14"] }, writing: { questionIds: ["q15"] }, speaking: { questionIds: ["q16"] } } },
  { id: "exam-5", title: "Đề thi VSTEP ĐH Ngoại ngữ #5", type: "mock", level: "B1", isActive: true, questionCount: 40, duration: 60, blueprint: { listening: { questionIds: ["q17"] }, reading: { questionIds: ["q18"] }, writing: { questionIds: [] }, speaking: { questionIds: [] } } },
  { id: "exam-6", title: "Đề thi VSTEP ĐH Ngoại ngữ #6", type: "mock", level: "C1", isActive: true, questionCount: 80, duration: 172, blueprint: { listening: { questionIds: ["q19"] }, reading: { questionIds: ["q20"] }, writing: { questionIds: ["q21"] }, speaking: { questionIds: ["q22"] } } },
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
  { id: "w1", word: "family", pronunciation: "/ˈfæm.əl.i/", meaning: "gia đình", example: "My family is very supportive.", examples: ["My family is very supportive."], topicId: "vt-1", sortOrder: 1 },
  { id: "w2", word: "sibling", pronunciation: "/ˈsɪb.lɪŋ/", meaning: "anh chị em", example: "I have two siblings.", examples: ["I have two siblings."], topicId: "vt-1", sortOrder: 2 },
  { id: "w3", word: "relative", pronunciation: "/ˈrel.ə.tɪv/", meaning: "họ hàng", example: "We visit our relatives during holidays.", examples: ["We visit our relatives during holidays."], topicId: "vt-1", sortOrder: 3 },
  { id: "w4", word: "childhood", pronunciation: "/ˈtʃaɪld.hʊd/", meaning: "thời thơ ấu", example: "She had a happy childhood.", examples: ["She had a happy childhood."], topicId: "vt-1", sortOrder: 4 },
  { id: "w5", word: "upbringing", pronunciation: "/ˈʌp.brɪŋ.ɪŋ/", meaning: "sự nuôi dạy", example: "His upbringing shaped his character.", examples: ["His upbringing shaped his character."], topicId: "vt-1", sortOrder: 5 },
  { id: "w6", word: "curriculum", pronunciation: "/kəˈrɪk.jə.ləm/", meaning: "chương trình học", example: "The curriculum includes science.", examples: ["The curriculum includes science."], topicId: "vt-2", sortOrder: 1 },
  { id: "w7", word: "scholarship", pronunciation: "/ˈskɒl.ə.ʃɪp/", meaning: "học bổng", example: "She won a scholarship.", examples: ["She won a scholarship."], topicId: "vt-2", sortOrder: 2 },
  { id: "w8", word: "symptom", pronunciation: "/ˈsɪmp.təm/", meaning: "triệu chứng", example: "Fever is a common symptom.", examples: ["Fever is a common symptom."], topicId: "vt-3", sortOrder: 1 },
  { id: "w9", word: "innovation", pronunciation: "/ˌɪn.əˈveɪ.ʃən/", meaning: "sự đổi mới", example: "Innovation drives progress.", examples: ["Innovation drives progress."], topicId: "vt-4", sortOrder: 1 },
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

// ─── Overview Stats (aligned with frontend-v2 commit 94ac2b9) ─────

export interface OverviewStats {
  daysLeft: number;
  totalTests: number;
  avgScore: number;
  weakestSkill: "listening" | "reading" | "writing" | "speaking" | null;
}

export const MOCK_OVERVIEW_STATS: OverviewStats = {
  daysLeft: 16,
  totalTests: 23,
  avgScore: 5.8,
  weakestSkill: "writing",
};

// ─── Sentences ────────────────────────────────────────────────────

export const MOCK_SENTENCE_TOPICS: SentenceTopic[] = [] as any;

// ─── Practice Track (aligned with frontend-v2 PracticeTrackView) ──

export interface ScoreEntry { score: number; }
export interface TestSession {
  id: string;
  examId: string;
  listeningScore: number | null;
  readingScore: number | null;
  writingScore: number | null;
  speakingScore: number | null;
  completedAt: string;
}
export interface PracticeTrackData {
  spider: Record<string, { current: number; trend: string }>;
  skills: { skill: string; currentLevel: string; attemptCount: number; averageScore: number }[];
  recentScores: Record<string, ScoreEntry[]>;
  testSessions: TestSession[];
}

export const MOCK_PRACTICE_TRACK: PracticeTrackData = {
  spider: {
    listening: { current: 6.2, trend: "up" },
    reading: { current: 7.1, trend: "stable" },
    writing: { current: 5.4, trend: "down" },
    speaking: { current: 5.8, trend: "up" },
  },
  skills: [
    { skill: "listening", currentLevel: "B1", attemptCount: 12, averageScore: 6.2 },
    { skill: "reading", currentLevel: "B1", attemptCount: 15, averageScore: 7.1 },
    { skill: "writing", currentLevel: "A2", attemptCount: 8, averageScore: 5.4 },
    { skill: "speaking", currentLevel: "A2", attemptCount: 6, averageScore: 5.8 },
  ],
  recentScores: {
    listening: [{ score: 5.8 }, { score: 6.0 }, { score: 5.5 }, { score: 6.2 }, { score: 6.5 }, { score: 6.1 }, { score: 6.3 }, { score: 6.0 }, { score: 6.2 }, { score: 6.4 }],
    reading: [{ score: 6.8 }, { score: 7.0 }, { score: 6.5 }, { score: 7.2 }, { score: 7.0 }, { score: 7.1 }, { score: 7.3 }, { score: 7.0 }, { score: 7.1 }, { score: 7.2 }],
    writing: [{ score: 5.0 }, { score: 5.2 }, { score: 4.8 }, { score: 5.5 }, { score: 5.3 }, { score: 5.4 }, { score: 5.6 }, { score: 5.2 }, { score: 5.3 }, { score: 5.4 }],
    speaking: [{ score: 5.2 }, { score: 5.5 }, { score: 5.8 }, { score: 5.4 }, { score: 5.6 }, { score: 5.9 }, { score: 5.7 }, { score: 5.8 }, { score: 5.6 }, { score: 5.8 }],
  },
  testSessions: [
    { id: "sess-001", examId: "exam-a1b2c3", listeningScore: 6.5, readingScore: 7.2, writingScore: 5.5, speakingScore: 5.8, completedAt: new Date(Date.now() - 1 * 86400000).toISOString() },
    { id: "sess-002", examId: "exam-d4e5f6", listeningScore: 6.2, readingScore: 7.0, writingScore: null, speakingScore: null, completedAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    { id: "sess-003", examId: "exam-g7h8i9", listeningScore: 6.0, readingScore: 7.1, writingScore: 5.3, speakingScore: 5.6, completedAt: new Date(Date.now() - 5 * 86400000).toISOString() },
    { id: "sess-004", examId: "exam-j0k1l2", listeningScore: 5.8, readingScore: 6.8, writingScore: 5.0, speakingScore: null, completedAt: new Date(Date.now() - 7 * 86400000).toISOString() },
  ],
};
