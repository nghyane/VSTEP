import {
	BulbIcon,
	Cancel01Icon,
	CheckmarkCircle02Icon,
	Tick02Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import type {
	CriterionScore,
	InlineError,
	InlineHighlight,
	OutlinePoint,
} from "./writing-grading-shared"
import { CriterionBar, ErrorList, HighlightList, ScoreBadge } from "./writing-grading-shared"

// ═══════════════════════════════════════════════════
// Mock data
// ═══════════════════════════════════════════════════

export const MOCK_LEVEL2_RESULTS: Record<
	string,
	{
		score: number
		criteria: CriterionScore[]
		outlinePoints: OutlinePoint[]
		errors: InlineError[]
		suggestions: string[]
		highlights: InlineHighlight[]
		submittedText: string
	}
> = {
	"write-2": {
		score: 6.5,
		submittedText:
			"In the modern era, the internet has become an indispensable part of our daily lives. While some people believe that it has brought people closer together, others argue that it has made individuals more isolated. In my opinion, the internet has both positive and negative effects on human connections.\n\nOn the one hand, the internet has enabled people to communicate more easily across long distances. Social media platforms like Facebook and Instagram allow users to stay connected with friends and family members who live far away. For example, I can video call my relatives in another country, which was impossible a few decades ago. Moreover, online communities bring together people with similar interests, creating new friendships that transcend geographical boundaries.\n\nOn the other hand, excessive use of the internet can lead to social isolation. Many people spend too much time scrolling through social media instead of engaging in face-to-face interactions. This can result in weaker real-life relationships and feelings of loneliness. Research has shown that heavy social media users often experience more higher levels of anxiety and depression.\n\nIn conclusion, while the internet offers tremendous opportunities for connection, it is important to use it in moderation. We should balance our online activities with real-world interactions to maintain healthy relationships.",
		criteria: [
			{
				label: "Task Fulfillment",
				score: 7,
				maxScore: 10,
				comment:
					"Bài viết đáp ứng đầy đủ yêu cầu đề bài: thảo luận cả hai quan điểm và đưa ra ý kiến cá nhân.",
			},
			{
				label: "Organization",
				score: 6,
				maxScore: 10,
				comment:
					"Cấu trúc rõ ràng với mở bài, thân bài và kết bài. Tuy nhiên, đoạn phản biện chưa đủ sâu so với đoạn ủng hộ.",
			},
			{
				label: "Vocabulary",
				score: 7,
				maxScore: 10,
				comment:
					"Từ vựng phù hợp với chủ đề. Có sử dụng một số cụm từ nâng cao nhưng cần đa dạng hơn.",
			},
			{
				label: "Grammar",
				score: 6,
				maxScore: 10,
				comment: "Ngữ pháp chủ yếu chính xác. Có một số lỗi nhỏ cần chú ý sửa.",
			},
		],
		outlinePoints: [
			{ text: "Introduction: Giới thiệu chủ đề + nêu thesis statement", covered: true },
			{ text: "Body 1: Quan điểm 1 — Internet giúp kết nối mọi người", covered: true },
			{ text: "Body 1: Ví dụ cụ thể cho quan điểm 1", covered: true },
			{ text: "Body 2: Quan điểm 2 — Internet gây cô lập", covered: true },
			{ text: "Body 2: Ví dụ hoặc dẫn chứng cho quan điểm 2", covered: true },
			{ text: "Body 3: Quan điểm cá nhân với lập luận riêng", covered: false },
			{ text: "Conclusion: Tóm tắt + khẳng định lại quan điểm", covered: true },
		],
		errors: [
			{
				original: "more higher levels",
				correction: "higher levels",
				type: "grammar",
			},
			{
				original: "indispensable",
				correction: "integral / essential",
				type: "vocabulary",
			},
			{
				original: "result in weaker real-life relationships",
				correction: "lead to weaker real-life relationships",
				type: "vocabulary",
			},
		],
		highlights: [
			{
				phrase: "transcend geographical boundaries",
				note: "Cụm từ học thuật nâng cao, thể hiện khả năng diễn đạt tốt.",
				type: "structure",
			},
			{
				phrase: "stay connected with friends and family members",
				note: "Collocation tự nhiên, phù hợp ngữ cảnh.",
				type: "collocation",
			},
			{
				phrase: "On the one hand",
				note: "Từ nối so sánh đối lập, sử dụng chính xác.",
				type: "transition",
			},
			{
				phrase: "Moreover",
				note: "Từ nối bổ sung ý hiệu quả.",
				type: "transition",
			},
		],
		suggestions: [
			"Thêm một đoạn Body 3 trình bày quan điểm cá nhân rõ ràng hơn thay vì chỉ nêu trong kết bài.",
			"Sử dụng thêm câu phức (complex sentences) với mệnh đề quan hệ hoặc mệnh đề trạng ngữ.",
			"Bổ sung thêm ví dụ cụ thể từ nghiên cứu hoặc thống kê để tăng tính thuyết phục.",
		],
	},
}

// ═══════════════════════════════════════════════════
// Level 2 — Outline Guided (Gợi ý khung)
// ═══════════════════════════════════════════════════

export function WritingLevel2Detail({ examId }: { examId: string }) {
	const data = MOCK_LEVEL2_RESULTS[examId]
	if (!data)
		return <p className="p-6 text-sm text-muted-foreground">Chưa có dữ liệu chấm cho bài này.</p>

	const coveredCount = data.outlinePoints.filter((p) => p.covered).length

	return (
		<div className="space-y-5 p-5">
			{/* Score */}
			<div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-950/20">
				<p className="text-sm text-muted-foreground">Điểm tổng</p>
				<ScoreBadge score={data.score} maxScore={10} />
			</div>

			{/* Criteria scores */}
			<div className="space-y-3">
				{data.criteria.map((c) => (
					<CriterionBar key={c.label} criterion={c} />
				))}
			</div>

			{/* Outline checklist */}
			<div className="space-y-2">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<HugeiconsIcon icon={Tick02Icon} className="size-4 text-muted-foreground" />
						<h4 className="text-sm font-semibold">Checklist dàn ý</h4>
					</div>
					<span className="text-xs text-muted-foreground">
						{coveredCount}/{data.outlinePoints.length} hoàn thành
					</span>
				</div>
				<div className="space-y-1.5">
					{data.outlinePoints.map((point, i) => (
						<div key={i} className="flex items-start gap-2">
							<HugeiconsIcon
								icon={point.covered ? CheckmarkCircle02Icon : Cancel01Icon}
								className={cn(
									"mt-0.5 size-4 shrink-0",
									point.covered
										? "text-green-600 dark:text-green-400"
										: "text-red-400 dark:text-red-500",
								)}
							/>
							<span
								className={cn(
									"text-sm",
									point.covered ? "text-foreground" : "text-muted-foreground line-through",
								)}
							>
								{point.text}
							</span>
						</div>
					))}
				</div>
			</div>

			{/* Errors */}
			<ErrorList errors={data.errors} />

			{/* Highlights */}
			{data.highlights && <HighlightList highlights={data.highlights} />}

			{/* Suggestions */}
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<HugeiconsIcon icon={BulbIcon} className="size-4 text-muted-foreground" />
					<h4 className="text-sm font-semibold">Gợi ý cải thiện</h4>
				</div>
				<ul className="space-y-1.5 pl-1">
					{data.suggestions.map((s, i) => (
						<li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
							<span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/50" />
							{s}
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}
