// AiGradingCard — hiển thị mock kết quả AI chấm điểm cho bài Viết/Nói.
// Điểm theo 4 tiêu chí VSTEP: Task / Coherence / Lexical / Grammar (Writing)
// hoặc Task / Pronunciation / Lexical / Grammar (Speaking).

import { CircleCheck, Lightbulb, TriangleAlert } from "lucide-react"
import { cn } from "#/shared/lib/utils"
import { ChatGptIcon } from "#/shared/ui/ChatGptIcon"

export interface AiGradingCriterion {
	readonly label: string
	readonly score: number // 0-10
	readonly comment: string
}

export interface AiGradingResult {
	readonly overall: number // 0-10
	readonly band: string // "B1" | "B2" | "C1"...
	readonly summary: string
	readonly criteria: readonly AiGradingCriterion[]
	readonly strengths: readonly string[]
	readonly improvements: readonly string[]
	readonly suggestions: readonly string[]
}

export function AiGradingCard({ result }: { result: AiGradingResult }) {
	return (
		<section className="rounded-2xl border bg-card p-5 shadow-sm">
			<Header overall={result.overall} band={result.band} summary={result.summary} />
			<CriteriaGrid criteria={result.criteria} />
			<FeedbackLists
				strengths={result.strengths}
				improvements={result.improvements}
				suggestions={result.suggestions}
			/>
		</section>
	)
}

function Header({ overall, band, summary }: { overall: number; band: string; summary: string }) {
	return (
		<div className="flex flex-col gap-4 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
			<div className="min-w-0">
				<p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
					<ChatGptIcon className="size-3.5" />
					Chấm điểm bởi AI
				</p>
				<h3 className="mt-1 text-lg font-semibold">Kết quả đánh giá</h3>
				<p className="mt-1 text-sm text-muted-foreground">{summary}</p>
			</div>
			<div className="flex shrink-0 items-center gap-3">
				<ScoreCircle value={overall} />
				<div>
					<p className="text-xs text-muted-foreground">Band ước lượng</p>
					<p className="text-xl font-bold text-primary">{band}</p>
				</div>
			</div>
		</div>
	)
}

function ScoreCircle({ value }: { value: number }) {
	const pct = Math.max(0, Math.min(100, (value / 10) * 100))
	const color = value >= 7.5 ? "text-success" : value >= 5 ? "text-primary" : "text-warning"
	return (
		<div className="relative flex size-16 items-center justify-center">
			<svg viewBox="0 0 36 36" className="size-16 -rotate-90">
				<circle cx="18" cy="18" r="15.5" className="fill-none stroke-muted" strokeWidth="3" />
				<circle
					cx="18"
					cy="18"
					r="15.5"
					className={cn("fill-none transition-all", color)}
					stroke="currentColor"
					strokeWidth="3"
					strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
					strokeLinecap="round"
				/>
			</svg>
			<span className={cn("absolute text-base font-bold tabular-nums", color)}>
				{value.toFixed(1)}
			</span>
		</div>
	)
}

function CriteriaGrid({ criteria }: { criteria: readonly AiGradingCriterion[] }) {
	return (
		<div className="mt-4 grid gap-3 sm:grid-cols-2">
			{criteria.map((c) => (
				<CriterionRow key={c.label} criterion={c} />
			))}
		</div>
	)
}

function CriterionRow({ criterion }: { criterion: AiGradingCriterion }) {
	const pct = Math.max(0, Math.min(100, (criterion.score / 10) * 100))
	return (
		<div className="rounded-xl bg-muted/50 p-3">
			<div className="flex items-baseline justify-between gap-2">
				<p className="text-sm font-semibold">{criterion.label}</p>
				<p className="text-sm font-bold tabular-nums text-primary">
					{criterion.score.toFixed(1)}
					<span className="text-xs text-muted-foreground">/10</span>
				</p>
			</div>
			<div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
				<div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
			</div>
			<p className="mt-2 text-xs text-muted-foreground">{criterion.comment}</p>
		</div>
	)
}

function FeedbackLists({
	strengths,
	improvements,
	suggestions,
}: {
	strengths: readonly string[]
	improvements: readonly string[]
	suggestions: readonly string[]
}) {
	return (
		<div className="mt-4 grid gap-3 md:grid-cols-3">
			<FeedbackList
				title="Điểm mạnh"
				items={strengths}
				Icon={CircleCheck}
				iconClass="text-success"
			/>
			<FeedbackList
				title="Cần cải thiện"
				items={improvements}
				Icon={TriangleAlert}
				iconClass="text-warning"
			/>
			<FeedbackList title="Gợi ý" items={suggestions} Icon={Lightbulb} iconClass="text-primary" />
		</div>
	)
}

interface FeedbackListProps {
	title: string
	items: readonly string[]
	Icon: typeof CircleCheck
	iconClass: string
}

function FeedbackList({ title, items, Icon, iconClass }: FeedbackListProps) {
	if (items.length === 0) return null
	return (
		<div className="rounded-xl bg-muted/50 p-3">
			<p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
				<Icon className={cn("size-3.5", iconClass)} />
				{title}
			</p>
			<ul className="mt-2 space-y-1.5 text-sm">
				{items.map((item) => (
					<li key={item} className="flex gap-1.5 text-foreground/90">
						<span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted-foreground/60" />
						<span>{item}</span>
					</li>
				))}
			</ul>
		</div>
	)
}
