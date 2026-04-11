// Mock data cho trang Overview
// Khi có API thật: xóa file này, sửa queryFn trong lib/queries/overview.ts

export interface ActivityData {
	activityByDay: Record<string, number> // "YYYY-MM-DD" → số hoạt động trong ngày
	totalStudyTimeMinutes: number
	totalExercises: number
	streak: number
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
	skills: [
		{ skill: "listening", currentLevel: "A1", attemptCount: 0, averageScore: 0 },
		{ skill: "reading", currentLevel: "A1", attemptCount: 0, averageScore: 0 },
		{ skill: "writing", currentLevel: "A1", attemptCount: 0, averageScore: 0 },
		{ skill: "speaking", currentLevel: "A1", attemptCount: 0, averageScore: 0 },
	],
	goal: null, // null = hiện empty state GoalCard
	spider: {
		listening: { current: 0, trend: "insufficient_data" },
		reading: { current: 0, trend: "insufficient_data" },
		writing: { current: 0, trend: "insufficient_data" },
		speaking: { current: 0, trend: "insufficient_data" },
	},
}

// ── Mock fetch (giả async như API thật) ───────────────────────────
export async function mockFetchOverview(): Promise<OverviewData> {
	await new Promise((r) => setTimeout(r, 300)) // giả latency
	return MOCK_OVERVIEW
}
