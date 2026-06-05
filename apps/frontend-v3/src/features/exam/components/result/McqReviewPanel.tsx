import { useEffect, useMemo, useState } from "react"
import { ScrollArea } from "#/components/ScrollArea"
import type { McqReviewGroup, McqReviewItem } from "#/features/exam/components/result/helpers"
import { SKILL_LABEL } from "#/features/exam/components/result/helpers"
import { cn } from "#/lib/utils"

const OPTION_LABELS = ["A", "B", "C", "D"] as const

type FilterId = "all" | "wrong" | "unanswered"

const FILTERS: readonly { readonly id: FilterId; readonly label: string }[] = [
	{ id: "all", label: "Tất cả" },
	{ id: "wrong", label: "Sai" },
	{ id: "unanswered", label: "Chưa làm" },
]

interface Props {
	readonly groups: readonly McqReviewGroup[]
}

export function McqReviewPanel({ groups }: Props) {
	const [activeId, setActiveId] = useState(groups[0]?.id ?? "")
	const [filter, setFilter] = useState<FilterId>("all")

	useEffect(() => {
		if (!groups.find((group) => group.id === activeId)) setActiveId(groups[0]?.id ?? "")
	}, [groups, activeId])

	const activeGroup = groups.find((group) => group.id === activeId) ?? groups[0]
	const visibleItems = useMemo(() => filterItems(activeGroup?.items ?? [], filter), [activeGroup, filter])

	if (!activeGroup) return <EmptyPanel text="Phần này chưa có câu trắc nghiệm." />

	const wrongCount = activeGroup.items.filter((item) => item.status === "wrong").length
	const unansweredCount = activeGroup.items.filter((item) => item.status === "unanswered").length
	const isListening = activeGroup.skill === "listening"
	const hasContext = Boolean(activeGroup.contextBody)

	return (
		<div className="flex h-full min-h-0 flex-col overflow-hidden bg-surface">
			<header className="shrink-0 border-b border-border px-4 py-3">
				<div className="flex flex-wrap items-center justify-between gap-3">
					<div className="min-w-0">
						<p className="text-xs font-extrabold text-muted">Review trắc nghiệm</p>
						<p className="mt-0.5 text-lg font-extrabold text-foreground">
							{SKILL_LABEL[activeGroup.skill]} · {activeGroup.label}
						</p>
					</div>
					<p className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm font-black tabular-nums">
						{activeGroup.correct}/{activeGroup.total} đúng
					</p>
				</div>

				<div className="mt-3 flex flex-wrap items-center justify-between gap-2">
					<div className="flex min-w-0 gap-2 overflow-x-auto pb-1 scrollbar-none">
						{groups.map((group) => (
							<button
								type="button"
								key={group.id}
								onClick={() => {
									setActiveId(group.id)
									setFilter("all")
								}}
								className={cn(
									"shrink-0 rounded-lg border px-3 py-1.5 text-xs font-extrabold transition-all",
									activeGroup.id === group.id
										? "border-primary bg-primary-tint text-primary-dark shadow-sm"
										: "border-border bg-background text-muted hover:text-foreground",
								)}
							>
								{group.label}
								<span className="ml-1.5 opacity-80">
									({group.correct}/{group.total})
								</span>
							</button>
						))}
					</div>

					<div className="flex shrink-0 flex-wrap justify-end gap-2 pb-1">
						{FILTERS.map((item) => {
							const count =
								item.id === "all" ? activeGroup.total : item.id === "wrong" ? wrongCount : unansweredCount
							return (
								<FilterChip
									key={item.id}
									label={item.label}
									count={count}
									active={filter === item.id}
									onClick={() => setFilter(item.id)}
								/>
							)
						})}
					</div>
				</div>
			</header>

			<div
				className={cn(
					"flex min-h-0 flex-1 flex-col",
					hasContext && "lg:grid lg:grid-cols-[minmax(0,0.95fr)_minmax(380px,1fr)]",
				)}
			>
				{activeGroup.contextBody && (
					<ScrollArea className="max-h-36 shrink-0 border-b border-border bg-background/60 sm:max-h-48 lg:max-h-none lg:min-h-0 lg:shrink lg:border-r lg:border-b-0">
						<section className="px-4 py-4">
							<p className="text-xs font-extrabold text-muted">{isListening ? "Transcript" : "Bài đọc"}</p>
							{activeGroup.contextLabel && (
								<p className="mt-1 text-base font-extrabold text-foreground">{activeGroup.contextLabel}</p>
							)}
							<p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-foreground/90">
								{activeGroup.contextBody}
							</p>
						</section>
					</ScrollArea>
				)}

				<ScrollArea className="min-h-0 flex-1">
					<div className="divide-y divide-border">
						{visibleItems.length === 0 ? (
							<EmptyPanel text="Không có câu nào trong bộ lọc này." />
						) : (
							visibleItems.map((item) => <QuestionCard key={item.id} item={item} />)
						)}
					</div>
				</ScrollArea>
			</div>
		</div>
	)
}

function FilterChip({
	label,
	count,
	active,
	onClick,
}: {
	readonly label: string
	readonly count: number
	readonly active: boolean
	readonly onClick: () => void
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"rounded-lg border px-3 py-1.5 text-xs font-extrabold",
				active
					? "border-primary bg-primary/10 text-primary"
					: "border-border bg-background text-muted hover:text-foreground",
			)}
		>
			{label}
			<span className="ml-1.5 opacity-80">({count})</span>
		</button>
	)
}

function QuestionCard({ item }: { readonly item: McqReviewItem }) {
	return (
		<article className="px-4 py-4">
			<div className="flex flex-wrap items-center gap-2">
				<p className="text-sm font-black text-foreground">Câu {item.no}</p>
				<StatusBadge status={item.status} label={item.statusLabel} />
				{item.status !== "unanswered" && item.selectedLabel ? (
					<span className="ml-auto text-xs font-bold text-muted">Bạn chọn: {item.selectedLabel}</span>
				) : null}
			</div>

			<p className="mt-2 text-sm leading-7 text-foreground">{item.stem}</p>

			<div className="mt-3 space-y-1.5">
				{OPTION_LABELS.map((letter, index) => (
					<OptionRow
						key={letter}
						letter={letter}
						text={item.options[index] ?? "—"}
						isCorrect={item.correctLabel === letter}
						isSelected={item.selectedLabel === letter}
					/>
				))}
			</div>
		</article>
	)
}

function OptionRow({
	letter,
	text,
	isCorrect,
	isSelected,
}: {
	readonly letter: (typeof OPTION_LABELS)[number]
	readonly text: string
	readonly isCorrect: boolean
	readonly isSelected: boolean
}) {
	const wrongPick = isSelected && !isCorrect
	const variant = isCorrect ? "correct" : wrongPick ? "wrong" : "neutral"

	return (
		<div className={cn("flex items-start gap-2 rounded-lg px-2.5 py-2 text-sm", optionRowClass(variant))}>
			<span
				className={cn(
					"mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-lg border text-[10px] font-extrabold",
					optionMarkerClass(variant),
				)}
			>
				{letter}
			</span>
			<span className="flex-1 leading-relaxed">{text}</span>
		</div>
	)
}

function StatusBadge({
	status,
	label,
}: {
	readonly status: McqReviewItem["status"]
	readonly label: string
}) {
	const tone =
		status === "correct"
			? "border-primary/40 bg-primary-tint/35 text-primary-dark"
			: status === "wrong"
				? "border-destructive/40 bg-destructive-tint text-destructive"
				: "border-border bg-background text-muted"

	return <span className={cn("rounded-lg border px-2 py-0.5 text-[11px] font-black", tone)}>{label}</span>
}

function optionRowClass(variant: "correct" | "wrong" | "neutral"): string {
	if (variant === "correct") return "border-l-2 border-l-primary bg-primary/10"
	if (variant === "wrong") return "border-l-2 border-l-destructive bg-destructive-tint/25"
	return "border-l-2 border-l-transparent bg-background"
}

function optionMarkerClass(variant: "correct" | "wrong" | "neutral"): string {
	if (variant === "correct") return "border-primary bg-primary text-primary-foreground"
	if (variant === "wrong") return "border-destructive bg-destructive text-white"
	return "border-border bg-surface text-muted"
}

function filterItems(items: readonly McqReviewItem[], filter: FilterId): McqReviewItem[] {
	if (filter === "all") return [...items]
	return items.filter((item) => item.status === filter)
}

function EmptyPanel({ text }: { readonly text: string }) {
	return <div className="py-10 text-center text-sm font-bold text-muted">{text}</div>
}
