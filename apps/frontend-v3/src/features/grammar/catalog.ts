import type { GrammarPoint } from "#/features/grammar/types"

export interface GrammarTier {
	key: string
	title: string
	subtitle: string
	description: string
	levels: string[]
}

export const GRAMMAR_TIERS: GrammarTier[] = [
	{
		key: "beginner",
		title: "Mất gốc",
		subtitle: "Bắt đầu lại từ đầu",
		description: "Nắm lại nền móng: động từ be, have, thì hiện tại, câu hỏi, giới từ.",
		levels: ["A1"],
	},
	{
		key: "intermediate",
		title: "Nền tảng",
		subtitle: "Đủ dùng cho giao tiếp và bài thi cơ bản",
		description: "Hệ thống hóa: các thì, so sánh, modal, bị động, điều kiện, mệnh đề quan hệ, tường thuật.",
		levels: ["A2", "B1"],
	},
	{
		key: "advanced",
		title: "Nâng cao",
		subtitle: "Tăng điểm Writing & Speaking",
		description: "Cấu trúc phức tạp: đảo ngữ, câu chẻ, danh từ hóa, mệnh đề rút gọn, liên kết học thuật.",
		levels: ["B2", "C1"],
	},
]

export interface GrammarTierGroup {
	tier: GrammarTier
	points: GrammarPoint[]
}

export function groupByTier(points: GrammarPoint[]): GrammarTierGroup[] {
	return GRAMMAR_TIERS.map((tier) => ({
		tier,
		points: points.filter((p) => p.levels.some((l) => tier.levels.includes(l.toUpperCase()))),
	})).filter((g) => g.points.length > 0)
}

export function findStarterPoint(points: GrammarPoint[]): GrammarPoint | null {
	return points[0] ?? null
}
