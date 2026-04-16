// Mock data cho trang Overview
// Khi có API thật: xóa file này, sửa queryFn trong lib/queries/overview.ts

export interface ActivityData {
	activityByDay: Record<string, number> // "YYYY-MM-DD" → số hoạt động trong ngày
	totalStudyTimeMinutes: number
	totalExercises: number
	streak: number
}

// 4 stat cards cho tab Tổng quan
export interface OverviewStats {
	daysLeft: number // số ngày còn lại đến ngày thi
	totalTests: number // tổng bài test đã làm
	avgScore: number // điểm TB toàn phần (0–10)
	weakestSkill: "listening" | "reading" | "writing" | "speaking" | null
}

export interface SkillProgress {
	skill: "listening" | "reading" | "writing" | "speaking"
	currentLevel: string
	attemptCount: number
	averageScore: number // 0–10
}

export interface EnrichedGoal {
	targetBand: "B1" | "B2" | "C1"
	deadline: string // ISO date
	daysRemaining: number | null
	dailyStudyTimeMinutes: number
	currentEstimatedBand: string
	achieved: boolean
	onTrack: boolean | null
}

export interface SpiderSkillData {
	current: number // 0–10
	trend: "up" | "down" | "stable" | "insufficient_data"
}

export type NextActionCategory = "vocabulary" | "grammar" | "test"

export interface NextAction {
	category: NextActionCategory
	title: string
	subtitle: string
	estimateMinutes: number
	targetUrl: "/luyen-tap/nen-tang/tu-vung" | "/luyen-tap/nen-tang/ngu-phap" | "/thi-thu"
}

// ── Learning Path types ───────────────────────────────────────────
type Skill = "listening" | "reading" | "writing" | "speaking"

export interface WeakTopic {
	id: string
	name: string
	masteryScore: number // 0–100
}

export interface WeeklyPlanItem {
	skill: Skill
	currentLevel: string
	targetLevel: string
	priority: number
	sessionsPerWeek: number
	estimatedMinutes: number
	recommendedLevel: string
	focusArea: string | null
	weakTopics: WeakTopic[]
}

export interface LearningPathData {
	projectedImprovement: string
	totalMinutesPerWeek: number
	weeklyPlan: WeeklyPlanItem[]
}

// ── Practice Track types ────────────────────────────────────────
export interface ScoreEntry {
	score: number
}

export interface TestSession {
	id: string
	examId: string
	listeningScore: number | null
	readingScore: number | null
	writingScore: number | null
	speakingScore: number | null
	completedAt: string // ISO
}

export interface PracticeTrackData {
	spider: Record<Skill, SpiderSkillData>
	skills: SkillProgress[]
	recentScores: Record<Skill, ScoreEntry[]>
	testSessions: TestSession[]
}

export interface OverviewData {
	user: {
		fullName: string
		initials: string
		entryLevel: string
		predictedLevel: string
		targetLevel: string
		examDate: string
		daysUntilExam: number
		progressPct: number // 0–100, ước tính mức hoàn thành lộ trình
	}
	activity: ActivityData
	overviewStats: OverviewStats
	skills: SkillProgress[]
	goal: EnrichedGoal | null
	spider: Record<"listening" | "reading" | "writing" | "speaking", SpiderSkillData>
	nextAction: NextAction
}

// ── Helper để sinh activityByDay giả (giống contribution graph GitHub) ────
function recentActivity(sparsity = 0.55): Record<string, number> {
	const out: Record<string, number> = {}
	const today = new Date()
	for (let i = 1; i <= 90; i++) {
		if (Math.random() > sparsity) {
			const d = new Date(today)
			d.setDate(today.getDate() - i)
			const key = d.toISOString().slice(0, 10)
			// Phân phối lệch về giá trị thấp, thi thoảng có ngày hoạt động mạnh
			out[key] = Math.max(1, Math.floor(Math.random() ** 2 * 12) + 1)
		}
	}
	return out
}

// ── Mock response ─────────────────────────────────────────────────
export const MOCK_OVERVIEW: OverviewData = {
	user: {
		fullName: "Nguyễn Phát",
		initials: "NP",
		entryLevel: "A1",
		predictedLevel: "A1",
		targetLevel: "C1",
		examDate: "28/04/2026",
		daysUntilExam: 16,
		progressPct: 12,
	},
	nextAction: {
		category: "grammar",
		title: "Thì hiện tại hoàn thành",
		subtitle: "Học lý thuyết và làm 6 câu bài tập trắc nghiệm",
		estimateMinutes: 10,
		targetUrl: "/luyen-tap/nen-tang/ngu-phap",
	},
	activity: {
		activityByDay: recentActivity(0.55),
		totalStudyTimeMinutes: 0,
		totalExercises: 0,
		streak: 7,
	},
	overviewStats: {
		daysLeft: 16,
		totalTests: 23,
		avgScore: 5.8,
		weakestSkill: "writing",
	},
	skills: [
		{ skill: "listening", currentLevel: "B1", attemptCount: 12, averageScore: 6.2 },
		{ skill: "reading",   currentLevel: "B1", attemptCount: 15, averageScore: 7.1 },
		{ skill: "writing",   currentLevel: "A2", attemptCount: 8,  averageScore: 5.4 },
		{ skill: "speaking",  currentLevel: "A2", attemptCount: 6,  averageScore: 5.8 },
	],
	goal: null, // null = hiện empty state GoalCard
	spider: {
		listening: { current: 6.2, trend: "up" },
		reading:   { current: 7.1, trend: "stable" },
		writing:   { current: 5.4, trend: "down" },
		speaking:  { current: 5.8, trend: "up" },
	},
}

// ── Mock LearningPath data ─────────────────────────────────────────
export const MOCK_LEARNING_PATH: LearningPathData = {
	projectedImprovement: "Cải thiện 0.5 band sau 4 tuần",
	totalMinutesPerWeek: 180,
	weeklyPlan: [
		{
			skill: "listening",
			currentLevel: "A2",
			targetLevel: "B1",
			priority: 1,
			sessionsPerWeek: 3,
			estimatedMinutes: 30,
			recommendedLevel: "B1",
			focusArea: "Nghe tin tức",
			weakTopics: [
				{ id: "t1", name: "Từ vựng học thuật", masteryScore: 35 },
				{ id: "t2", name: "Cấu trúc câu phức", masteryScore: 50 },
				{ id: "t3", name: "Inference", masteryScore: 28 },
			],
		},
		{
			skill: "reading",
			currentLevel: "A2",
			targetLevel: "B1",
			priority: 2,
			sessionsPerWeek: 2,
			estimatedMinutes: 25,
			recommendedLevel: "B1",
			focusArea: "Đọc bài báo",
			weakTopics: [
				{ id: "t4", name: "Skimming & Scanning", masteryScore: 60 },
				{ id: "t5", name: "Paraphrasing", masteryScore: 42 },
			],
		},
		{
			skill: "writing",
			currentLevel: "A1",
			targetLevel: "B1",
			priority: 3,
			sessionsPerWeek: 2,
			estimatedMinutes: 40,
			recommendedLevel: "B1",
			focusArea: "Essay Task 1",
			weakTopics: [
				{ id: "t6", name: "Linking words", masteryScore: 25 },
				{ id: "t7", name: "Grammar accuracy", masteryScore: 38 },
				{ id: "t8", name: "Word count", masteryScore: 70 },
			],
		},
		{
			skill: "speaking",
			currentLevel: "A1",
			targetLevel: "B1",
			priority: 4,
			sessionsPerWeek: 2,
			estimatedMinutes: 30,
			recommendedLevel: "B1",
			focusArea: "Part 3 Discussion",
			weakTopics: [
				{ id: "t9", name: "Fluency", masteryScore: 30 },
				{ id: "t10", name: "Pronunciation", masteryScore: 55 },
			],
		},
	],
}

// ── Mock PracticeTrack data ─────────────────────────────────────────
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
		listening: [
			{ score: 5.8 },
			{ score: 6.0 },
			{ score: 5.5 },
			{ score: 6.2 },
			{ score: 6.5 },
			{ score: 6.1 },
			{ score: 6.3 },
			{ score: 6.0 },
			{ score: 6.2 },
			{ score: 6.4 },
		],
		reading: [
			{ score: 6.8 },
			{ score: 7.0 },
			{ score: 6.5 },
			{ score: 7.2 },
			{ score: 7.0 },
			{ score: 7.1 },
			{ score: 7.3 },
			{ score: 7.0 },
			{ score: 7.1 },
			{ score: 7.2 },
		],
		writing: [
			{ score: 5.0 },
			{ score: 5.2 },
			{ score: 4.8 },
			{ score: 5.5 },
			{ score: 5.3 },
			{ score: 5.4 },
			{ score: 5.6 },
			{ score: 5.2 },
			{ score: 5.3 },
			{ score: 5.4 },
		],
		speaking: [
			{ score: 5.2 },
			{ score: 5.5 },
			{ score: 5.8 },
			{ score: 5.4 },
			{ score: 5.6 },
			{ score: 5.9 },
			{ score: 5.7 },
			{ score: 5.8 },
			{ score: 5.6 },
			{ score: 5.8 },
		],
	},
	testSessions: [
		{
			id: "sess-001",
			examId: "exam-a1b2c3",
			listeningScore: 6.5,
			readingScore: 7.2,
			writingScore: 5.5,
			speakingScore: 5.8,
			completedAt: new Date(Date.now() - 1 * 86400000).toISOString(),
		},
		{
			id: "sess-002",
			examId: "exam-d4e5f6",
			listeningScore: 6.2,
			readingScore: 7.0,
			writingScore: null,
			speakingScore: null,
			completedAt: new Date(Date.now() - 2 * 86400000).toISOString(),
		},
		{
			id: "sess-003",
			examId: "exam-g7h8i9",
			listeningScore: 6.0,
			readingScore: 7.1,
			writingScore: 5.3,
			speakingScore: 5.6,
			completedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
		},
		{
			id: "sess-004",
			examId: "exam-j0k1l2",
			listeningScore: 5.8,
			readingScore: 6.8,
			writingScore: 5.0,
			speakingScore: null,
			completedAt: new Date(Date.now() - 7 * 86400000).toISOString(),
		},
	],
}

// ── Mock fetch (giả async như API thật) ───────────────────────────
export async function mockFetchOverview(): Promise<OverviewData> {
	await new Promise((r) => setTimeout(r, 300)) // giả latency
	return MOCK_OVERVIEW
}
