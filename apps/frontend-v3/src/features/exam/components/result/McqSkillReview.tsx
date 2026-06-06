import { type ReactNode, useEffect, useMemo, useState } from "react"
import { ScrollArea } from "#/components/ScrollArea"
import type { McqReviewGroup, McqReviewItem } from "#/features/exam/components/result/helpers"
import { buildMcqSkillReviewView } from "#/features/exam/components/result/view-model"
import type { SessionResultsData } from "#/features/exam/types"
import { cn } from "#/lib/utils"

type FilterId = "review" | "all"

interface Props {
	readonly result: SessionResultsData
	readonly skill: "listening" | "reading"
}

export function McqSkillReview({ result, skill }: Props) {
	const view = useMemo(() => buildMcqSkillReviewView(result, skill), [result, skill])
	const [activeId, setActiveId] = useState(view.groups[0]?.id ?? "")
	const [filter, setFilter] = useState<FilterId>(view.hasReviewItems ? "review" : "all")

	useEffect(() => {
		setActiveId(view.groups[0]?.id ?? "")
		setFilter(view.hasReviewItems ? "review" : "all")
	}, [view])

	const activeGroup = view.groups.find((group) => group.id === activeId) ?? view.groups[0]
	const visibleItems = useMemo(() => filterItems(activeGroup?.items ?? [], filter), [activeGroup, filter])

	if (!activeGroup) return <EmptyState text="Phần này chưa có câu trắc nghiệm." />

	const groupReviewCount = activeGroup.items.filter((item) => item.status !== "correct").length

	return (
		<div className="flex h-full min-h-0 flex-col bg-surface">
			<header className="shrink-0 border-b-2 border-border-light bg-surface px-4 py-4">
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="min-w-0">
						<p className="text-xs font-black uppercase tracking-[0.16em] text-muted">Sai ở đâu</p>
						<h2 className="mt-1 text-xl font-black text-foreground">
							{view.title} · {activeGroup.label}
						</h2>
						<p className="mt-1 text-sm font-bold text-muted">
							{activeGroup.correct}/{activeGroup.total} đúng · {groupReviewCount} cần xem lại
						</p>
					</div>
					<div className="rounded-(--radius-button) bg-background px-3 py-2 text-sm font-black tabular-nums text-foreground">
						{view.correct}/{view.total}
					</div>
				</div>

				<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
					<GroupTabs groups={view.groups} activeId={activeGroup.id} onSelect={setActiveId} />
					<div className="flex shrink-0 flex-wrap items-center gap-2">
						<FilterButton active={filter === "review"} onClick={() => setFilter("review")}>
							Cần xem lại ({view.reviewCount})
						</FilterButton>
						<FilterButton active={filter === "all"} onClick={() => setFilter("all")}>
							Tất cả ({view.total})
						</FilterButton>
					</div>
				</div>
			</header>

			<ScrollArea className="min-h-0 flex-1 bg-background">
				<div className="space-y-4 p-4">
					<ContextBlock group={activeGroup} />
					{visibleItems.length === 0 ? (
						<EmptyState text="Không có câu nào cần xem lại trong phần này." />
					) : (
						visibleItems.map((item) => <QuestionCard key={item.id} item={item} />)
					)}
				</div>
			</ScrollArea>
		</div>
	)
}

function GroupTabs({
	groups,
	activeId,
	onSelect,
}: {
	readonly groups: readonly McqReviewGroup[]
	readonly activeId: string
	readonly onSelect: (id: string) => void
}) {
	if (groups.length <= 1) return null

	return (
		<div className="flex min-w-0 flex-1 gap-2 overflow-x-auto pb-1 scrollbar-none">
			{groups.map((group) => (
				<button
					type="button"
					key={group.id}
					onClick={() => onSelect(group.id)}
					className={cn(
						"shrink-0 rounded-full border-2 px-3 py-1.5 text-xs font-extrabold transition-colors",
						activeId === group.id
							? "border-primary/35 bg-primary-tint text-primary-dark"
							: "border-border bg-background text-subtle hover:text-foreground",
					)}
				>
					{group.label} · {group.correct}/{group.total}
				</button>
			))}
		</div>
	)
}

function FilterButton({
	active,
	onClick,
	children,
}: {
	readonly active: boolean
	readonly onClick: () => void
	readonly children: ReactNode
}) {
	return (
		<button
			type="button"
			onClick={onClick}
			className={cn(
				"rounded-full border-2 px-3 py-1.5 text-xs font-black transition-colors",
				active
					? "border-primary/35 bg-primary-tint text-primary-dark"
					: "border-border bg-background text-subtle hover:text-foreground",
			)}
		>
			{children}
		</button>
	)
}

function ContextBlock({ group }: { readonly group: McqReviewGroup }) {
	if (!group.contextBody) return null

	return (
		<details className="rounded-(--radius-card) border-2 border-border bg-surface px-4 py-3 text-sm text-foreground/90">
			<summary className="cursor-pointer text-xs font-black uppercase tracking-[0.14em] text-muted">
				{group.skill === "listening" ? "Transcript" : "Bài đọc"}
			</summary>
			{group.contextLabel && <p className="mt-3 font-extrabold text-foreground">{group.contextLabel}</p>}
			<p className="mt-2 whitespace-pre-wrap leading-7">{group.contextBody}</p>
		</details>
	)
}

function QuestionCard({ item }: { readonly item: McqReviewItem }) {
	return (
		<article className="rounded-(--radius-card) border-2 border-border bg-surface p-4">
			<div className="flex flex-wrap items-center gap-2">
				<p className="text-sm font-black text-foreground">Câu {item.no}</p>
				<AnswerStatus status={item.status} label={item.statusLabel} />
			</div>

			<p className="mt-3 text-sm leading-7 text-foreground">{item.stem}</p>

			<div className="mt-3 grid gap-2 text-xs font-bold text-muted sm:grid-cols-2">
				<p>
					Bạn chọn: <span className="text-foreground">{item.selectedLabel ?? "Chưa làm"}</span>
				</p>
				<p>
					Đáp án đúng: <span className="text-primary-dark">{item.correctLabel}</span>
				</p>
			</div>

			<div className="mt-4 space-y-2">
				{item.options.map((option, index) => {
					const letter = optionLetter(index)
					return (
						<OptionRow
							key={`${item.id}-${letter}`}
							letter={letter}
							text={option}
							isCorrect={item.correctLabel === letter}
							isSelected={item.selectedLabel === letter}
						/>
					)
				})}
			</div>
		</article>
	)
}

function AnswerStatus({
	status,
	label,
}: {
	readonly status: McqReviewItem["status"]
	readonly label: string
}) {
	return (
		<span className={cn("rounded-(--radius-button) px-2 py-0.5 text-[11px] font-black", statusTone(status))}>
			{label}
		</span>
	)
}

function OptionRow({
	letter,
	text,
	isCorrect,
	isSelected,
}: {
	readonly letter: string
	readonly text: string
	readonly isCorrect: boolean
	readonly isSelected: boolean
}) {
	const wrongPick = isSelected && !isCorrect
	return (
		<div
			className={cn(
				"flex items-start gap-2 rounded-(--radius-button) px-3 py-2 text-sm",
				optionTone(isCorrect, wrongPick),
			)}
		>
			<span
				className={cn(
					"mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-[10px] font-black",
					markerTone(isCorrect, wrongPick),
				)}
			>
				{letter}
			</span>
			<span className="flex-1 leading-relaxed">{text}</span>
		</div>
	)
}

function filterItems(items: readonly McqReviewItem[], filter: FilterId): McqReviewItem[] {
	if (filter === "all") return [...items]
	return items.filter((item) => item.status !== "correct")
}

function optionLetter(index: number): string {
	return ["A", "B", "C", "D"][index] ?? "—"
}

function statusTone(status: McqReviewItem["status"]): string {
	if (status === "correct") return "bg-primary-tint text-primary-dark"
	if (status === "wrong") return "bg-destructive-tint text-destructive"
	return "bg-background text-muted"
}

function optionTone(isCorrect: boolean, wrongPick: boolean): string {
	if (isCorrect) return "bg-primary-tint/70 text-foreground"
	if (wrongPick) return "bg-destructive-tint text-foreground"
	return "bg-background text-foreground"
}

function markerTone(isCorrect: boolean, wrongPick: boolean): string {
	if (isCorrect) return "bg-primary text-primary-foreground"
	if (wrongPick) return "bg-destructive text-white"
	return "bg-surface text-muted"
}

function EmptyState({ text }: { readonly text: string }) {
	return (
		<div className="rounded-(--radius-card) border-2 border-border bg-surface px-4 py-10 text-center text-sm font-bold text-muted">
			{text}
		</div>
	)
}
