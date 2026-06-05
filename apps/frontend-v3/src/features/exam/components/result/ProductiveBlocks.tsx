import type { ReactNode } from "react"
import type { ExamResultStatus } from "#/features/exam/types"
import { FeedbackSection, RewriteSection } from "#/features/grading/components/FeedbackSection"
import { RubricBar } from "#/features/grading/components/RubricBar"
import { feedbackImprovements } from "#/features/grading/feedback"
import type { AssessmentFeedback, CriterionScore } from "#/features/grading/types"
import { cn, round } from "#/lib/utils"
import { scoreLabel, statusLabel } from "./helpers"

export type ProductiveTabItem = {
	readonly id: string
	readonly label: string
	readonly score: number | null
	readonly status: ExamResultStatus
}

type Tone = "writing" | "speaking"

const TONE_COLOR: Record<Tone, string> = {
	writing: "var(--color-skill-writing)",
	speaking: "var(--color-skill-speaking)",
}

export function ProductiveLayout({
	title,
	items,
	activeId,
	onSelect,
	tone,
	children,
}: {
	readonly title: string
	readonly items: readonly ProductiveTabItem[]
	readonly activeId: string
	readonly onSelect: (id: string) => void
	readonly tone: Tone
	readonly children: ReactNode
}) {
	return (
		<div className="flex h-full min-h-0 flex-col bg-surface">
			<header className="shrink-0 border-b border-border bg-background/60 p-3">
				<div className="flex flex-wrap items-center justify-between gap-3 px-1">
					<div>
						<p className="text-xs font-black uppercase tracking-[0.16em] text-muted">Chi tiết</p>
						<p className="mt-1 text-base font-extrabold text-foreground">{title}</p>
					</div>
					<p className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs font-black text-muted">
						{items.length} phần
					</p>
				</div>

				<div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
					{items.map((item) => (
						<button
							key={item.id}
							type="button"
							onClick={() => onSelect(item.id)}
							className={cn(
								"flex min-w-[10rem] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition-colors",
								item.id === activeId
									? "border-primary bg-surface text-foreground shadow-sm"
									: "border-border bg-surface/70 text-muted hover:border-primary/45 hover:text-foreground",
							)}
						>
							<span className="truncate text-sm font-extrabold">{item.label}</span>
							<span className="shrink-0 text-xs font-black tabular-nums" style={{ color: TONE_COLOR[tone] }}>
								{item.score === null ? statusLabel(item.status) : scoreLabel(item.score)}
							</span>
						</button>
					))}
				</div>
			</header>
			<div className="min-h-0 flex-1">{children}</div>
		</div>
	)
}

export function ProductiveHeader({
	title,
	status,
	score,
	tone,
	meta,
}: {
	readonly title: string
	readonly status: ExamResultStatus
	readonly score: number | null
	readonly tone: Tone
	readonly meta?: string
}) {
	const color = TONE_COLOR[tone]

	return (
		<header className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-4">
			<div className="min-w-0">
				<p className="text-xl font-extrabold text-foreground">{title}</p>
				<p className="mt-1 text-sm font-bold text-muted">
					{meta ? `${meta} · ${statusLabel(status)}` : statusLabel(status)}
				</p>
			</div>
			<p className="text-3xl font-black tabular-nums" style={{ color: score === null ? undefined : color }}>
				{scoreLabel(score)}
			</p>
		</header>
	)
}

export function DetailSection({ title, children }: { readonly title: string; readonly children: ReactNode }) {
	return (
		<section className="border-b border-border px-4 py-4 last:border-b-0">
			<p className="text-xs font-extrabold text-muted">{title}</p>
			<div className="mt-2 text-sm leading-7 text-foreground/90">{children}</div>
		</section>
	)
}

export function RubricSection({
	scores,
	labels,
	tone,
}: {
	readonly scores: readonly CriterionScore[] | null
	readonly labels: Record<string, string>
	readonly tone: Tone
}) {
	if (!scores || scores.length === 0) return null

	return (
		<DetailSection title="Điểm theo tiêu chí">
			<div className="space-y-3">
				{scores.map((criterion) => (
					<RubricBar
						key={criterion.key}
						label={labels[criterion.key] ?? criterion.key}
						score={round(criterion.score)}
						max={10}
						color={TONE_COLOR[tone]}
					/>
				))}
			</div>
		</DetailSection>
	)
}

export function FeedbackBlock({ feedback }: { readonly feedback: AssessmentFeedback | null }) {
	if (!feedback) return null

	return (
		<DetailSection title="Nhận xét AI">
			<div className="space-y-4">
				<FeedbackSection strengths={feedback.strengths ?? []} improvements={feedbackImprovements(feedback)} />
				<RewriteSection rewrites={feedback.rewrites ?? []} />
			</div>
		</DetailSection>
	)
}

export function PendingBlock({ status }: { readonly status: ExamResultStatus }) {
	if (status === "ready") return null

	return (
		<DetailSection title="Trạng thái">
			<p className="font-bold text-muted">{statusLabel(status)}</p>
		</DetailSection>
	)
}

export function EmptyPanel({ text }: { readonly text: string }) {
	return (
		<div className="flex h-full items-center justify-center px-4 text-center text-sm font-bold text-muted">
			{text}
		</div>
	)
}

export function speakingPromptText(content: Record<string, unknown>): string {
	const lines = Object.entries(content).flatMap(([key, value]) => formatPromptLine(humanizeKey(key), value))
	return lines.length > 0 ? lines.join("\n") : "Chưa có nội dung đề."
}

function formatPromptLine(label: string, value: unknown): string[] {
	if (Array.isArray(value)) return [`${label}: ${value.map(formatPromptValue).join("; ")}`]
	if (isPlainObject(value)) {
		const nested = Object.entries(value).map(
			([key, entry]) => `- ${humanizeKey(key)}: ${formatPromptValue(entry)}`,
		)
		return [`${label}:`, ...nested]
	}
	return [`${label}: ${formatPromptValue(value)}`]
}

function formatPromptValue(value: unknown): string {
	if (typeof value === "string") return value
	if (typeof value === "number" || typeof value === "boolean") return String(value)
	if (value === null || value === undefined) return "—"
	if (Array.isArray(value)) return value.map(formatPromptValue).join("; ")
	if (isPlainObject(value)) {
		return Object.entries(value)
			.map(([key, entry]) => `${humanizeKey(key)}: ${formatPromptValue(entry)}`)
			.join("; ")
	}
	return String(value)
}

function humanizeKey(key: string): string {
	return key.replaceAll("_", " ")
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value)
}
