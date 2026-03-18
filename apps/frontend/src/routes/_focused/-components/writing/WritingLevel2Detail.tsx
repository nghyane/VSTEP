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
// Mock data (shared for Level 2 & Level 3)
// ═══════════════════════════════════════════════════

export const MOCK_LEVEL2_RESULTS: Record<
	string,
	{
		score: number
		criteria: CriterionScore[]
		outlinePoints?: OutlinePoint[]
		errors: InlineError[]
		suggestions?: string[]
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
	"write-3": {
		score: 6.0,
		submittedText:
			"Dear Mr. Johnson,\n\nI am writing to inform you about the professional development course I recently attended. The course, titled \"Effective Communication in the Workplace,\" was held at the City Conference Center from March 10 to March 12.\n\nDuring the three-day training, I learned several valuable skills, including how to deliver clear and concise presentations, manage difficult conversations with colleagues, and write professional emails more effectively. The course also covered active listening techniques and strategies for giving constructive feedback.\n\nI believe the company could greatly benefit from this training. Firstly, improved communication skills would enhance teamwork and reduce misunderstandings between departments. Secondly, the presentation skills module would be particularly useful for our sales team when meeting with clients. I would recommend that the company consider organizing a similar workshop for all employees.\n\nI would be happy to share the course materials with you and discuss this further at your convenience.\n\nYours sincerely",
		criteria: [
			{
				label: "Task Fulfillment",
				score: 6.5,
				maxScore: 10,
				comment:
					"Bài viết đáp ứng đầy đủ 3 yêu cầu: mô tả khóa học, nêu bài học rút ra, và đề xuất lợi ích cho công ty.",
			},
			{
				label: "Organization",
				score: 6,
				maxScore: 10,
				comment:
					"Cấu trúc thư trang trọng hợp lý: lời chào, nội dung 3 đoạn, lời kết. Tuy nhiên đoạn 2 có thể phát triển thêm.",
			},
			{
				label: "Vocabulary",
				score: 5.5,
				maxScore: 10,
				comment:
					"Từ vựng phù hợp với ngữ cảnh trang trọng. Cần đa dạng hơn các cụm từ formal.",
			},
			{
				label: "Grammar",
				score: 6,
				maxScore: 10,
				comment: "Ngữ pháp tương đối chính xác. Một số câu có thể cải thiện cấu trúc phức tạp hơn.",
			},
		],
		errors: [
			{
				original: "write professional emails more effectively",
				correction: "compose professional emails more effectively",
				type: "vocabulary",
			},
		],
		highlights: [
			{
				phrase: "I am writing to inform you",
				note: "Mở đầu thư trang trọng chuẩn mực.",
				type: "structure",
			},
			{
				phrase: "at your convenience",
				note: "Cụm từ trang trọng phù hợp, thể hiện sự lịch sự.",
				type: "collocation",
			},
			{
				phrase: "Firstly",
				note: "Từ nối liệt kê rõ ràng, giúp bài viết mạch lạc.",
				type: "transition",
			},
		],
		suggestions: [
			"Bổ sung thêm chi tiết cụ thể về khóa học (tên giảng viên, số lượng tham dự).",
			"Sử dụng thêm cấu trúc bị động phù hợp với văn phong trang trọng.",
			"Thêm số liệu hoặc ví dụ minh họa cho lợi ích mà công ty có thể đạt được.",
		],
	},
	"write-4": {
		score: 7.0,
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
		suggestions: [
			"Bổ sung thêm số liệu thống kê hoặc dẫn chứng nghiên cứu cụ thể.",
			"Phát triển thêm giải pháp từ phía cộng đồng (community programs).",
			"Sử dụng thêm câu bị động và cấu trúc đảo ngữ để nâng band điểm.",
			"Kiểm tra kỹ lỗi chính tả và nhất quán spelling convention.",
		],
	},
}

// ═══════════════════════════════════════════════════
// Level 2 & 3 — Shared grading detail component
// ═══════════════════════════════════════════════════

export function WritingLevel2Detail({ examId }: { examId: string }) {
	const data = MOCK_LEVEL2_RESULTS[examId]
	if (!data)
		return <p className="p-6 text-sm text-muted-foreground">Chưa có dữ liệu chấm cho bài này.</p>

	const outlinePoints = data.outlinePoints
	const coveredCount = outlinePoints?.filter((p) => p.covered).length ?? 0

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

			{/* Outline checklist (only for levels that have outline data) */}
			{outlinePoints && outlinePoints.length > 0 && (
				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-2">
							<HugeiconsIcon icon={Tick02Icon} className="size-4 text-muted-foreground" />
							<h4 className="text-sm font-semibold">Checklist dàn ý</h4>
						</div>
						<span className="text-xs text-muted-foreground">
							{coveredCount}/{outlinePoints.length} hoàn thành
						</span>
					</div>
					<div className="space-y-1.5">
						{outlinePoints.map((point, i) => (
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
			)}

			{/* Errors */}
			<ErrorList errors={data.errors} />

			{/* Highlights */}
			{data.highlights && <HighlightList highlights={data.highlights} />}

			{/* Suggestions */}
			{data.suggestions && data.suggestions.length > 0 && (
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
			)}
		</div>
	)
}
