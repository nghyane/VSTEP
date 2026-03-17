import {
	BulbIcon,
	CheckmarkCircle02Icon,
	LaurelWreathFirst01Icon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import type { CriterionScore, InlineError, InlineHighlight } from "./writing-grading-shared"
import { CriterionBar, ErrorList, HighlightList, ScoreBadge } from "./writing-grading-shared"

// ═══════════════════════════════════════════════════
// Mock data
// ═══════════════════════════════════════════════════

export const MOCK_LEVEL3_RESULTS: Record<
	string,
	{
		overallScore: number
		criteria: CriterionScore[]
		errors: InlineError[]
		highlights: InlineHighlight[]
		strengths: string[]
		improvements: string[]
		submittedText: string
	}
> = {
	"write-4": {
		overallScore: 7.0,
		submittedText:
			"In recent years, the rate of crime committed by teenagers has become a growing concern in many countries around the world. This alarming trend has significant impacts on communities and raises important questions about its root causes and potential solutions.\n\nOne of the primary causes of teenage crime is the lack of parental supervision. Many parents are too busy with work and do not spend enough time monitoring their children's activities. As a result, teenagers may fall into bad company and engage in criminal behaviour. Furthermore, broken families and domestic violence can push young people towards crime as they seek acceptance elsewhere.\n\nAnother contributing factor is the influence of media and technology. Violent video games, movies, and social media content can desensitize teenagers to violence and criminal activity. Young people who are exposed to such content may begin to view criminal behavior as normal or even desirable.\n\nTo address this issue, several measures can be taken. Firstly, parents should be more involved in their childrens lives and maintain open communication. Schools should also implement programs that teach conflict resolution and critical thinking skills. Additionally, the government should enforce stricter regulations on media content that glorifies violence.\n\nIn conclusion, teenage crime is a complex issue that requires a multi-faceted approach. By addressing the root causes through family involvement, education, and government regulation, we can work towards reducing this disturbing trend.",
		criteria: [
			{
				label: "Task Fulfillment",
				score: 7.5,
				maxScore: 10,
				comment:
					"Bài viết đáp ứng tốt yêu cầu đề bài. Trình bày được nguyên nhân và giải pháp cho vấn đề tội phạm vị thành niên. Các ý được phát triển hợp lý với ví dụ cụ thể.",
			},
			{
				label: "Organization",
				score: 7.0,
				maxScore: 10,
				comment:
					"Cấu trúc bài viết mạch lạc: mở bài giới thiệu vấn đề, thân bài phân tích nguyên nhân và giải pháp, kết bài tổng kết. Sử dụng liên từ hiệu quả.",
			},
			{
				label: "Vocabulary",
				score: 7.5,
				maxScore: 10,
				comment:
					"Từ vựng phong phú, phù hợp với chủ đề học thuật. Sử dụng tốt các cụm từ như 'alarming trend', 'root causes', 'multi-faceted approach'.",
			},
			{
				label: "Grammar",
				score: 6.0,
				maxScore: 10,
				comment:
					"Ngữ pháp tương đối tốt nhưng có một số lỗi: thiếu dấu sở hữu cách ('childrens' → 'children\\'s'), lẫn lộn 'behaviour/behavior'.",
			},
		],
		errors: [
			{ original: "childrens", correction: "children's", type: "grammar" },
			{
				original: "behaviour",
				correction: "behavior (nhất quán American English)",
				type: "spelling",
			},
		],
		highlights: [
			{
				phrase: "a growing concern in many countries",
				note: "Cụm từ học thuật mạnh, phù hợp essay chủ đề xã hội.",
				type: "structure",
			},
			{
				phrase: "desensitize teenagers to violence",
				note: "Dùng từ nâng cao chính xác, tăng band điểm Vocabulary.",
				type: "collocation",
			},
			{
				phrase: "As a result",
				note: "Từ nối nguyên nhân–kết quả, logic mạch lạc.",
				type: "transition",
			},
			{
				phrase: "a multi-faceted approach",
				note: "Collocation học thuật ấn tượng, thường xuất hiện trong bài mẫu điểm cao.",
				type: "collocation",
			},
		],
		strengths: [
			"Bài viết có cấu trúc rõ ràng, dễ theo dõi.",
			"Sử dụng liên từ đa dạng: Furthermore, As a result, Additionally, Firstly.",
			"Từ vựng nâng cao phù hợp: 'desensitize', 'multi-faceted', 'contributing factor'.",
			"Kết bài tổng kết hiệu quả và gợi mở hướng giải quyết.",
		],
		improvements: [
			"Bổ sung thêm số liệu thống kê hoặc dẫn chứng nghiên cứu cụ thể.",
			"Phát triển thêm giải pháp từ phía cộng đồng (community programs).",
			"Sử dụng thêm câu bị động và cấu trúc đảo ngữ để nâng band điểm.",
			"Kiểm tra kỹ lỗi chính tả và nhất quán spelling convention.",
		],
	},
}

// ═══════════════════════════════════════════════════
// Level 3 — Exam Simulation (Thực chiến)
// ═══════════════════════════════════════════════════

export function WritingLevel3Detail({ examId }: { examId: string }) {
	const data = MOCK_LEVEL3_RESULTS[examId]
	if (!data)
		return <p className="p-6 text-sm text-muted-foreground">Chưa có dữ liệu chấm cho bài này.</p>

	return (
		<div className="space-y-5 p-5">
			{/* Overall score */}
			<div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
				<div className="flex items-center gap-2">
					<HugeiconsIcon icon={LaurelWreathFirst01Icon} className="size-5 text-primary" />
					<p className="text-sm font-medium">VSTEP Band Score</p>
				</div>
				<div className="mt-1">
					<ScoreBadge score={data.overallScore} maxScore={10} />
				</div>
			</div>

			{/* Criteria grid */}
			<div className="grid grid-cols-2 gap-2">
				{data.criteria.map((c) => {
					const pct = (c.score / c.maxScore) * 100
					const color =
						pct >= 80
							? "text-green-600 dark:text-green-400"
							: pct >= 60
								? "text-amber-600 dark:text-amber-400"
								: "text-red-600 dark:text-red-400"
					return (
						<div key={c.label} className="rounded-lg border p-3 text-center">
							<p className="text-xs text-muted-foreground">{c.label}</p>
							<p className={cn("text-lg font-bold", color)}>{c.score}</p>
						</div>
					)
				})}
			</div>

			{/* Detailed criteria */}
			<div className="space-y-3">
				{data.criteria.map((c) => (
					<CriterionBar key={c.label} criterion={c} />
				))}
			</div>

			{/* Errors */}
			<ErrorList errors={data.errors} />

			{/* Highlights */}
			{data.highlights && <HighlightList highlights={data.highlights} />}

			{/* Strengths */}
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<HugeiconsIcon
						icon={CheckmarkCircle02Icon}
						className="size-4 text-green-600 dark:text-green-400"
					/>
					<h4 className="text-sm font-semibold">Điểm mạnh</h4>
				</div>
				<ul className="space-y-1.5 pl-1">
					{data.strengths.map((s, i) => (
						<li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
							<span className="mt-1.5 size-1 shrink-0 rounded-full bg-green-500" />
							{s}
						</li>
					))}
				</ul>
			</div>

			{/* Improvements */}
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<HugeiconsIcon icon={BulbIcon} className="size-4 text-amber-600 dark:text-amber-400" />
					<h4 className="text-sm font-semibold">Cần cải thiện</h4>
				</div>
				<ul className="space-y-1.5 pl-1">
					{data.improvements.map((s, i) => (
						<li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
							<span className="mt-1.5 size-1 shrink-0 rounded-full bg-amber-500" />
							{s}
						</li>
					))}
				</ul>
			</div>
		</div>
	)
}
