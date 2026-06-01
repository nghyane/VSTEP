import {
	ArrowTurnDownIcon,
	CheckmarkCircle02Icon,
	Edit02Icon,
	SparklesIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

// ═══════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════

export interface CriterionScore {
	label: string
	score: number
	maxScore: number
	comment: string
}

export interface InlineError {
	original: string
	correction: string
	type: "grammar" | "vocabulary" | "spelling"
	explanation?: string
}

export interface InlineHighlight {
	phrase: string
	note: string
	type: "structure" | "collocation" | "transition"
}

export interface TemplateSection {
	label: string
	status: "good" | "needs_improvement" | "missing"
	feedback: string
}

export interface OutlinePoint {
	text: string
	covered: boolean
}

export interface Collocation {
	phrase: string
	meaning: string
	example: string
}

// ═══════════════════════════════════════════════════
// Shared components
// ═══════════════════════════════════════════════════

export function ScoreBadge({ score, maxScore }: { score: number; maxScore: number }) {
	const pct = (score / maxScore) * 100
	const color =
		pct >= 80
			? "text-green-600 dark:text-green-400"
			: pct >= 60
				? "text-amber-600 dark:text-amber-400"
				: "text-red-600 dark:text-red-400"

	return (
		<span className={cn("text-2xl font-bold", color)}>
			{score}/{maxScore}
		</span>
	)
}

export function CriterionBar({ criterion }: { criterion: CriterionScore }) {
	const pct = (criterion.score / criterion.maxScore) * 100
	const barColor = pct >= 80 ? "bg-green-500" : pct >= 60 ? "bg-amber-500" : "bg-red-500"

	return (
		<div className="space-y-1.5">
			<div className="flex items-center justify-between">
				<span className="text-sm font-medium">{criterion.label}</span>
				<span className="text-sm font-semibold">
					{criterion.score}/{criterion.maxScore}
				</span>
			</div>
			<div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
				<div
					className={cn("h-full rounded-full transition-all", barColor)}
					style={{ width: `${pct}%` }}
				/>
			</div>
			<p className="text-xs text-muted-foreground">{criterion.comment}</p>
		</div>
	)
}

const errorTypeConfig: Record<string, { label: string; badge: string; highlight: string }> = {
	grammar: {
		label: "Ngữ pháp",
		badge: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
		highlight: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/40",
	},
	vocabulary: {
		label: "Từ vựng",
		badge: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
		highlight: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800/40",
	},
	spelling: {
		label: "Chính tả",
		badge: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
		highlight: "bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/40",
	},
}

export function ErrorList({ errors }: { errors: InlineError[] }) {
	if (errors.length === 0) return null

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<HugeiconsIcon icon={Edit02Icon} className="size-4 text-muted-foreground" />
				<h4 className="text-sm font-semibold">Lỗi cần sửa</h4>
				<Badge variant="secondary" className="ml-auto text-[10px]">
					{errors.length} lỗi
				</Badge>
			</div>
			<div className="space-y-2">
				{errors.map((err, i) => {
					const config = errorTypeConfig[err.type]
					return (
						<div
							key={i}
							className={cn("flex items-start gap-2 rounded-lg border p-2.5", config.highlight)}
						>
							<Badge variant="secondary" className={cn("shrink-0 text-[10px]", config.badge)}>
								{config.label}
							</Badge>
							<div className="flex-1 text-sm">
								<span className="line-through decoration-red-400">{err.original}</span>
								<HugeiconsIcon
									icon={ArrowTurnDownIcon}
									className="mx-1.5 inline size-3 text-muted-foreground"
								/>
								<span className="font-medium text-green-600 dark:text-green-400">
									{err.correction}
								</span>
								{err.explanation ? (
									<p className="mt-1 text-xs text-muted-foreground">{err.explanation}</p>
								) : null}
							</div>
						</div>
					)
				})}
			</div>
		</div>
	)
}

const highlightTypeConfig: Record<string, { label: string; badge: string }> = {
	structure: {
		label: "Cấu trúc hay",
		badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
	},
	collocation: {
		label: "Collocation",
		badge: "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400",
	},
	transition: {
		label: "Từ nối",
		badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
	},
}

export function HighlightList({ highlights }: { highlights: InlineHighlight[] }) {
	if (highlights.length === 0) return null

	return (
		<div className="space-y-2">
			<div className="flex items-center gap-2">
				<HugeiconsIcon icon={SparklesIcon} className="size-4 text-emerald-500" />
				<h4 className="text-sm font-semibold">Điểm sáng trong bài</h4>
				<Badge
					variant="secondary"
					className="ml-auto bg-emerald-100 text-[10px] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
				>
					{highlights.length} flex
				</Badge>
			</div>
			<div className="space-y-2">
				{highlights.map((h, i) => {
					const config = highlightTypeConfig[h.type]
					return (
						<div
							key={i}
							className="rounded-lg border border-emerald-200 bg-emerald-50/30 p-2.5 dark:border-emerald-800/40 dark:bg-emerald-950/10"
						>
							<div className="flex items-center gap-2">
								<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-3.5 text-emerald-500" />
								<span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
									{h.phrase}
								</span>
								<Badge
									variant="secondary"
									className={cn("ml-auto shrink-0 text-[10px]", config.badge)}
								>
									{config.label}
								</Badge>
							</div>
							<p className="mt-1 pl-5.5 text-xs text-muted-foreground">{h.note}</p>
						</div>
					)
				})}
			</div>
		</div>
	)
}
