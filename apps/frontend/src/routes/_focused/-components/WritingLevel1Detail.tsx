import {
	BookOpen01Icon,
	BulbIcon,
	CheckmarkCircle02Icon,
	SparklesIcon,
	TextIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { Collocation, TemplateSection } from "./writing-grading-shared"
import { ScoreBadge } from "./writing-grading-shared"

// ═══════════════════════════════════════════════════
// Mock data
// ═══════════════════════════════════════════════════

export const MOCK_LEVEL1_RESULTS: Record<
	string,
	{
		score: number
		templateSections: TemplateSection[]
		transitionWordsUsed: string[]
		transitionWordsSuggested: string[]
		collocations: Collocation[]
		submittedText: string
	}
> = {
	"write-1": {
		score: 7.5,
		submittedText:
			"Dear Brianna,\n\nThank you so much for agreeing to help me. I really appreciate it.\n\n[First of all], I will be leaving for Dubai on December 15th and I plan to return on December 22nd. So I will be away for about a week.\n\n[Regarding] my pet, I have a cat named Mimi. She needs to be fed twice a day — once in the morning and once in the evening. Her food is in the kitchen cabinet. [In addition], please make sure she has fresh water every day. She also loves to play with her toy mouse, so if you have time, please play with her a little.\n\n[As for] the house, could you please water the plants in the living room every two days? [Furthermore], please check the mailbox daily and keep any letters for me.\n\n[Finally], thank you again for your help. I hope you and Mimi will get along well!\n\nBest regards",
		templateSections: [
			{
				label: "Lời chào & cảm ơn",
				status: "good",
				feedback: "Mở đầu tự nhiên, thể hiện sự biết ơn phù hợp.",
			},
			{
				label: "Thông tin chuyến đi",
				status: "good",
				feedback: "Cung cấp đầy đủ ngày đi và ngày về.",
			},
			{
				label: "Hướng dẫn chăm sóc thú cưng",
				status: "good",
				feedback: "Chi tiết rõ ràng về cách cho ăn và chơi với mèo.",
			},
			{
				label: "Công việc nhà",
				status: "needs_improvement",
				feedback: "Nên bổ sung thêm chi tiết về việc khóa cửa, tắt đèn khi ra ngoài.",
			},
			{
				label: "Lời kết",
				status: "good",
				feedback: "Kết thúc lịch sự và ấm áp.",
			},
		],
		transitionWordsUsed: [
			"First of all",
			"Regarding",
			"In addition",
			"As for",
			"Furthermore",
			"Finally",
		],
		transitionWordsSuggested: [
			"Moreover",
			"On top of that",
			"Not to mention",
			"Last but not least",
		],
		collocations: [
			{
				phrase: "take care of",
				meaning: "chăm sóc",
				example: "Could you take care of my cat while I'm away?",
			},
			{
				phrase: "I would really appreciate it if",
				meaning: "Tôi sẽ rất biết ơn nếu",
				example: "I would really appreciate it if you could water the plants.",
			},
			{
				phrase: "keep an eye on",
				meaning: "để ý, trông chừng",
				example: "Please keep an eye on the house for any issues.",
			},
			{
				phrase: "make sure (that)",
				meaning: "đảm bảo rằng",
				example: "Please make sure that the doors are locked at night.",
			},
		],
	},
}

// ═══════════════════════════════════════════════════
// Level 1 — Template Guided (Trợ nhiệt tình)
// ═══════════════════════════════════════════════════

export function WritingLevel1Detail({ examId }: { examId: string }) {
	const data = MOCK_LEVEL1_RESULTS[examId]
	if (!data)
		return <p className="p-6 text-sm text-muted-foreground">Chưa có dữ liệu chấm cho bài này.</p>

	return (
		<div className="space-y-5 p-5">
			{/* Score */}
			<div className="rounded-xl border border-green-200 bg-green-50/50 p-4 dark:border-green-800 dark:bg-green-950/20">
				<p className="text-sm text-muted-foreground">Điểm tổng</p>
				<ScoreBadge score={data.score} maxScore={10} />
			</div>

			{/* Template sections evaluation */}
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<HugeiconsIcon icon={TextIcon} className="size-4 text-muted-foreground" />
					<h4 className="text-sm font-semibold">Đánh giá theo phần</h4>
				</div>
				<div className="space-y-2">
					{data.templateSections.map((section, i) => (
						<div
							key={i}
							className={cn(
								"rounded-lg border p-3",
								section.status === "good"
									? "border-green-200 bg-green-50/30 dark:border-green-800/50 dark:bg-green-950/10"
									: section.status === "needs_improvement"
										? "border-amber-200 bg-amber-50/30 dark:border-amber-800/50 dark:bg-amber-950/10"
										: "border-red-200 bg-red-50/30 dark:border-red-800/50 dark:bg-red-950/10",
							)}
						>
							<div className="flex items-center gap-2">
								<HugeiconsIcon
									icon={section.status === "good" ? CheckmarkCircle02Icon : BulbIcon}
									className={cn(
										"size-4",
										section.status === "good"
											? "text-green-600 dark:text-green-400"
											: "text-amber-600 dark:text-amber-400",
									)}
								/>
								<span className="text-sm font-medium">{section.label}</span>
							</div>
							<p className="mt-1 pl-6 text-xs text-muted-foreground">{section.feedback}</p>
						</div>
					))}
				</div>
			</div>

			{/* Transition words */}
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<HugeiconsIcon icon={SparklesIcon} className="size-4 text-muted-foreground" />
					<h4 className="text-sm font-semibold">Từ nối đã dùng</h4>
				</div>
				<div className="flex flex-wrap gap-1.5">
					{data.transitionWordsUsed.map((w) => (
						<Badge
							key={w}
							variant="secondary"
							className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
						>
							{w}
						</Badge>
					))}
				</div>
				<p className="text-xs text-muted-foreground">Gợi ý thêm:</p>
				<div className="flex flex-wrap gap-1.5">
					{data.transitionWordsSuggested.map((w) => (
						<Badge key={w} variant="outline" className="text-muted-foreground">
							{w}
						</Badge>
					))}
				</div>
			</div>

			{/* Collocations */}
			<div className="space-y-2">
				<div className="flex items-center gap-2">
					<HugeiconsIcon icon={BookOpen01Icon} className="size-4 text-muted-foreground" />
					<h4 className="text-sm font-semibold">Collocations gợi ý</h4>
				</div>
				<div className="space-y-2">
					{data.collocations.map((col, i) => (
						<div key={i} className="rounded-lg bg-muted/30 p-3">
							<p className="text-sm font-medium text-primary">{col.phrase}</p>
							<p className="mt-0.5 text-xs text-muted-foreground">{col.meaning}</p>
							<p className="mt-1 text-xs italic text-muted-foreground">"{col.example}"</p>
						</div>
					))}
				</div>
			</div>
		</div>
	)
}

// ═══════════════════════════════════════════════════
// Level 1 annotated text (highlights transition words)
// ═══════════════════════════════════════════════════

export function Level1AnnotatedText({ text }: { text: string }) {
	if (!text) return <p className="text-sm text-muted-foreground">Chưa có bài viết.</p>

	const parts = text.split(/(\[.*?\])/)

	return (
		<div className="whitespace-pre-wrap text-sm leading-relaxed">
			{parts.map((part, i) => {
				if (part.startsWith("[") && part.endsWith("]")) {
					return (
						<span key={i} className="rounded bg-primary/10 px-1 font-medium text-primary">
							{part.slice(1, -1)}
						</span>
					)
				}
				return <span key={i}>{part}</span>
			})}
		</div>
	)
}
