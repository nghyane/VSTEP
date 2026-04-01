import { AlertCircleIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { SpiderChart } from "@/components/common/SpiderChart"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { SubmissionFull, WritingContent, WritingTier } from "@/types/api"
import { AnnotatedEssay } from "./AnnotatedEssay"
import { MarkdownFeedback } from "./MarkdownFeedback"
import type { CriterionScore } from "./writing-grading-shared"

const TIER_BADGE: Record<WritingTier, { label: string; className: string }> = {
	1: {
		label: "Trợ nhiệt tình",
		className: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
	},
	2: {
		label: "Gợi ý khung",
		className: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	},
	3: {
		label: "Thực chiến",
		className: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
	},
}

interface WritingGradingResultProps {
	submission: SubmissionFull
	submittedText: string
	content: WritingContent | null
	tier?: WritingTier
}

interface AICriteria {
	key: string
	name: string
	score: number
	bandLabel?: string
}

const criteriaLabelFallback: Record<string, string> = {
	task_fulfillment: "Hoàn thành yêu cầu",
	organization: "Tổ chức bài viết",
	vocabulary: "Từ vựng",
	grammar: "Ngữ pháp",
}

// Màu cho từng tiêu chí theo thứ tự — dùng làm Tailwind text class trong SpiderChart
const CRITERION_COLORS = [
	"text-orange-500",
	"text-blue-500",
	"text-amber-500",
	"text-rose-500",
	"text-emerald-500",
	"text-purple-500",
]

function parseCriteria(result: unknown): CriterionScore[] {
	if (!result || typeof result !== "object") return []
	const r = result as Record<string, unknown>

	// BE returns { criteria: [{key, name, score, band_label}] }
	if (Array.isArray(r.criteria)) {
		return (r.criteria as AICriteria[]).map((c) => ({
			label: c.name || criteriaLabelFallback[c.key] || c.key,
			score: c.score,
			maxScore: 10,
			comment: c.bandLabel || "",
		}))
	}

	// Fallback: { criteriaScores: { key: score } }
	if (r.criteriaScores && typeof r.criteriaScores === "object") {
		return Object.entries(r.criteriaScores as Record<string, number>).map(([key, score]) => ({
			label: criteriaLabelFallback[key] || key,
			score,
			maxScore: 10,
			comment: "",
		}))
	}

	return []
}

function parseKnowledgeGaps(result: unknown): { name: string; category: string }[] {
	if (!result || typeof result !== "object") return []
	const r = result as Record<string, unknown>
	if (!Array.isArray(r.knowledgeGaps)) return []
	return (r.knowledgeGaps as { name: string; category: string }[]).filter((g) => g.name)
}

export function WritingGradingResult({
	submission,
	submittedText,
	content,
	tier = 3,
}: WritingGradingResultProps) {
	const criteria = parseCriteria(submission.result)
	const gaps = parseKnowledgeGaps(submission.result)
	const wordCount = submittedText.trim() ? submittedText.trim().split(/\s+/).length : 0
	const isFailed = submission.status === "failed"
	const feedback = submission.feedback ?? ""

	return (
		<div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
			{/* Left — Submitted text with error annotations */}
			<div className="w-full shrink-0 overflow-y-auto border-b p-6 lg:w-1/2 lg:border-b-0 lg:border-r">
				<div className="mb-4 flex items-center justify-between">
					<h3 className="text-lg font-bold">Bài viết đã nộp</h3>
					<div className="flex items-center gap-2">
						<Badge variant="secondary" className={TIER_BADGE[tier].className}>
							{TIER_BADGE[tier].label}
						</Badge>
						<span className="text-xs text-muted-foreground">{wordCount} từ</span>
					</div>
				</div>

				{/* Annotated essay — highlights errors extracted from feedback */}
				{feedback && submittedText ? (
					<AnnotatedEssay essayText={submittedText} feedback={feedback} />
				) : (
					<div className="whitespace-pre-wrap rounded-xl bg-muted/10 p-4 text-sm leading-relaxed">
						{submittedText}
					</div>
				)}

				{content && (
					<div className="mt-6">
						<p className="mb-2 text-xs font-semibold text-muted-foreground">Đề bài</p>
						<div className="whitespace-pre-wrap rounded-xl bg-muted/30 p-4 text-sm leading-relaxed text-muted-foreground">
							{content.prompt}
						</div>
					</div>
				)}
			</div>

			{/* Right — Grading result */}
			<div className="flex-1 overflow-y-auto p-6">
				{isFailed ? (
					<div className="flex flex-col items-center justify-center gap-3 py-10">
						<HugeiconsIcon icon={AlertCircleIcon} className="size-8 text-destructive" />
						<p className="font-semibold text-destructive">Chấm bài thất bại</p>
						<p className="text-center text-sm text-muted-foreground">
							Hệ thống không thể chấm bài này. Vui lòng thử lại sau.
						</p>
					</div>
				) : (
					<div className="space-y-6">
						{/* Overall score */}
						{submission.score !== null && (
							<div className="rounded-2xl bg-primary/10 p-5 text-center">
								<p className="text-sm font-medium text-muted-foreground">Điểm tổng</p>
								<p className="mt-1 text-4xl font-bold text-primary">
									{submission.score}
									<span className="text-lg font-normal text-muted-foreground"> / 10</span>
								</p>
								{submission.band && (
									<p className="mt-1 text-sm font-semibold text-primary">Band: {submission.band}</p>
								)}
							</div>
						)}

					{/* Criteria scores — spider chart */}
					{criteria.length > 0 && (
						<div className="space-y-4">
							<h4 className="text-sm font-semibold">Điểm từng tiêu chí</h4>

							{/* Spider chart */}
							<div className="flex justify-center">
								<SpiderChart
									skills={criteria.map((c, i) => ({
										label: c.label,
										value: c.score,
										color: CRITERION_COLORS[i % CRITERION_COLORS.length],
									}))}
									className="size-60"
								/>
							</div>

							{/* Legend — điểm + nhận xét ngắn từng tiêu chí */}
							<div className="divide-y divide-border rounded-xl border">
								{criteria.map((c, i) => {
									const color = CRITERION_COLORS[i % CRITERION_COLORS.length]
									const pct = (c.score / c.maxScore) * 100
									const scoreColor =
										pct >= 80
											? "text-green-600 dark:text-green-400"
											: pct >= 60
												? "text-amber-600 dark:text-amber-400"
												: "text-red-600 dark:text-red-400"
									return (
										<div key={c.label} className="flex items-start gap-3 px-4 py-3">
											<span
												className={cn(
													"mt-0.5 size-2.5 shrink-0 rounded-full",
													color.replace("text-", "bg-"),
												)}
											/>
											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between gap-2">
													<span className="text-sm font-medium">{c.label}</span>
													<span className={cn("shrink-0 text-sm font-bold tabular-nums", scoreColor)}>
														{c.score}
														<span className="text-xs font-normal text-muted-foreground">
															/{c.maxScore}
														</span>
													</span>
												</div>
												{c.comment && (
													<p className="mt-0.5 text-xs text-muted-foreground">{c.comment}</p>
												)}
											</div>
										</div>
									)
								})}
							</div>
						</div>
					)}

						{/* Feedback — rendered as markdown */}
						{feedback && (
							<div className="space-y-2">
								<h4 className="text-sm font-semibold">Nhận xét chi tiết</h4>
								<div className="rounded-xl bg-muted/30 p-4">
									<MarkdownFeedback feedback={feedback} />
								</div>
							</div>
						)}

						{/* Knowledge gaps */}
						{gaps.length > 0 && (
							<div className="space-y-2">
								<h4 className="text-sm font-semibold">Kiến thức cần cải thiện</h4>
								<div className="flex flex-wrap gap-2">
									{gaps.map((g) => (
										<Badge
											key={g.name}
											variant="outline"
											className={cn(
												"text-xs",
												g.category === "grammar" && "border-red-300 text-red-600 dark:text-red-400",
												g.category === "vocabulary" &&
													"border-amber-300 text-amber-600 dark:text-amber-400",
												g.category === "discourse" &&
													"border-blue-300 text-blue-600 dark:text-blue-400",
												g.category === "strategy" &&
													"border-purple-300 text-purple-600 dark:text-purple-400",
											)}
										>
											{g.name}
										</Badge>
									))}
								</div>
							</div>
						)}

						{/* Confidence indicator */}
						{submission.result &&
							typeof submission.result === "object" &&
							"confidence" in submission.result && (
								<div className="flex items-center gap-2 text-xs text-muted-foreground">
									<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5" />
									<span>
										Độ tin cậy:{" "}
										{(submission.result as unknown as { confidence: string }).confidence === "high"
											? "Cao"
											: (submission.result as unknown as { confidence: string }).confidence ===
													"medium"
												? "Trung bình"
												: "Thấp"}
									</span>
								</div>
							)}
					</div>
				)}
			</div>
		</div>
	)
}
