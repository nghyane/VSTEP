export type ExamSkillKey = "listening" | "reading" | "writing" | "speaking"

export interface ExamSection {
	id: string
	skill: ExamSkillKey
	part: number
	title: string
	description: string
	questionCount: number
	unit: "câu" | "bài" | "phần"
	durationMinutes: number
}

export interface ExamAttempt {
	date: string
	score: string
	durationSeconds: number
}

export interface ExamListItem {
	id: number
	isPro: boolean
}

export interface ExamDetail {
	id: number
	title: string
	isPro: boolean
	source: string
	tags: string[]
	totalDurationMinutes: number
	sections: readonly ExamSection[]
	attemptCount: number
	lastAttempt: ExamAttempt | null
}

export const VSTEP_SECTIONS: readonly ExamSection[] = [
	{
		id: "listening-1",
		skill: "listening",
		part: 1,
		title: "Phần 1",
		description: "Thông báo ngắn",
		questionCount: 8,
		unit: "câu",
		durationMinutes: 7,
	},
	{
		id: "listening-2",
		skill: "listening",
		part: 2,
		title: "Phần 2",
		description: "Hội thoại",
		questionCount: 12,
		unit: "câu",
		durationMinutes: 13,
	},
	{
		id: "listening-3",
		skill: "listening",
		part: 3,
		title: "Phần 3",
		description: "Bài giảng",
		questionCount: 15,
		unit: "câu",
		durationMinutes: 20,
	},
	{
		id: "reading-1",
		skill: "reading",
		part: 1,
		title: "Phần 1",
		description: "Bài đọc 1",
		questionCount: 10,
		unit: "câu",
		durationMinutes: 15,
	},
	{
		id: "reading-2",
		skill: "reading",
		part: 2,
		title: "Phần 2",
		description: "Bài đọc 2",
		questionCount: 10,
		unit: "câu",
		durationMinutes: 15,
	},
	{
		id: "reading-3",
		skill: "reading",
		part: 3,
		title: "Phần 3",
		description: "Bài đọc 3",
		questionCount: 10,
		unit: "câu",
		durationMinutes: 15,
	},
	{
		id: "reading-4",
		skill: "reading",
		part: 4,
		title: "Phần 4",
		description: "Bài đọc 4",
		questionCount: 10,
		unit: "câu",
		durationMinutes: 15,
	},
	{
		id: "writing-1",
		skill: "writing",
		part: 1,
		title: "Phần 1",
		description: "Viết thư (~120 từ)",
		questionCount: 1,
		unit: "bài",
		durationMinutes: 20,
	},
	{
		id: "writing-2",
		skill: "writing",
		part: 2,
		title: "Phần 2",
		description: "Viết luận (~250 từ)",
		questionCount: 1,
		unit: "bài",
		durationMinutes: 40,
	},
	{
		id: "speaking-1",
		skill: "speaking",
		part: 1,
		title: "Phần 1",
		description: "Tương tác xã hội",
		questionCount: 1,
		unit: "phần",
		durationMinutes: 4,
	},
	{
		id: "speaking-2",
		skill: "speaking",
		part: 2,
		title: "Phần 2",
		description: "Thảo luận giải pháp",
		questionCount: 1,
		unit: "phần",
		durationMinutes: 4,
	},
	{
		id: "speaking-3",
		skill: "speaking",
		part: 3,
		title: "Phần 3",
		description: "Phát triển chủ đề",
		questionCount: 1,
		unit: "phần",
		durationMinutes: 4,
	},
] as const

export async function mockFetchExamDetail(id: number): Promise<ExamDetail> {
	await new Promise((r) => setTimeout(r, 250))
	return {
		id,
		title: `Đề thi VSTEP HNUE 08/02/2026 #${id}`,
		isPro: id % 2 === 0,
		source: "HNUE",
		tags: ["#FullTest", "#HNUE"],
		totalDurationMinutes: 172,
		sections: VSTEP_SECTIONS,
		attemptCount: 1522,
		lastAttempt: id === 1 ? { date: "26/11/2024", score: "0/10", durationSeconds: 110 } : null,
	}
}
