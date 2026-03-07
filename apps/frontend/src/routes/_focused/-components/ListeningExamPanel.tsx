import { ArrowRight01Icon, HeadphonesIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { getObjectiveAnswer } from "@/routes/_learner/exams/-components/questions/useExamAnswers"
import type { ExamSessionDetail, ListeningContent, SubmissionAnswer } from "@/types/api"

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

interface ListeningExamPanelProps {
	questions: ExamSessionDetail["questions"]
	answers: Map<string, SubmissionAnswer>
	onSelectMCQ: (
		qId: string,
		current: Record<string, string>,
		itemIdx: number,
		optIdx: number,
	) => void
}

function formatTime(seconds: number): string {
	if (!seconds || !Number.isFinite(seconds)) return "00:00"
	const m = Math.floor(seconds / 60)
	const s = Math.floor(seconds % 60)
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

// --- MCQ Item (2-column grid, matches practice page style) ---

function ListeningMCQItem({
	index,
	stem,
	options,
	selectedOption,
	onSelect,
}: {
	index: number
	stem: string
	options: string[]
	selectedOption: string | null
	onSelect: (optionIndex: number) => void
}) {
	return (
		<div className="space-y-2">
			<p className="text-sm font-medium">
				Câu {index + 1}. {stem}
			</p>
			<div className="grid gap-2 sm:grid-cols-2">
				{options.map((opt, oi) => {
					const letter = LETTERS[oi] ?? String(oi + 1)
					const isSelected = selectedOption === letter
					return (
						<button
							key={`${index}-${oi}`}
							type="button"
							onClick={() => onSelect(oi)}
							className={cn(
								"flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition-all",
								isSelected
									? "border-primary bg-primary/5 ring-1 ring-primary/20"
									: "border-border hover:border-primary/40",
							)}
						>
							<span
								className={cn(
									"flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
									isSelected
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground",
								)}
							>
								{letter}
							</span>
							<span>{opt}</span>
						</button>
					)
				})}
			</div>
		</div>
	)
}

// --- Main Panel ---

export function ListeningExamPanel({ questions, answers, onSelectMCQ }: ListeningExamPanelProps) {
	// Each question object = one section/part, sorted by part number
	const sections = useMemo(() => [...questions].sort((a, b) => a.part - b.part), [questions])

	const [activeSectionIdx, setActiveSectionIdx] = useState(0)
	const audioRef = useRef<HTMLAudioElement>(null)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)

	const activeQuestion = sections[activeSectionIdx]
	const content = activeQuestion?.content as ListeningContent | undefined

	// Current section's saved answers
	const currentAnswers = useMemo(
		() => getObjectiveAnswer(answers, activeQuestion?.id ?? ""),
		[answers, activeQuestion?.id],
	)

	// Per-section metadata for tabs
	const sectionsMeta = useMemo(
		() =>
			sections.map((q) => {
				const c = q.content as ListeningContent
				const total = c.items?.length ?? 0
				const obj = getObjectiveAnswer(answers, q.id)
				const answered = Object.keys(obj).length
				return { part: q.part, total, answered }
			}),
		[sections, answers],
	)

	// Audio event listeners — re-bind when section changes
	useEffect(() => {
		const audio = audioRef.current
		if (!audio) return

		const onTimeUpdate = () => {
			setCurrentTime(audio.currentTime)
			if (audio.duration && Number.isFinite(audio.duration)) setDuration(audio.duration)
		}
		const onLoadedMetadata = () => {
			if (audio.duration && Number.isFinite(audio.duration)) setDuration(audio.duration)
		}
		const onEnded = () => {
			// Auto-advance to next section when audio finishes
			setActiveSectionIdx((i) => {
				if (i < sections.length - 1) return i + 1
				return i
			})
		}

		audio.addEventListener("timeupdate", onTimeUpdate)
		audio.addEventListener("loadedmetadata", onLoadedMetadata)
		audio.addEventListener("ended", onEnded)

		return () => {
			audio.removeEventListener("timeupdate", onTimeUpdate)
			audio.removeEventListener("loadedmetadata", onLoadedMetadata)
			audio.removeEventListener("ended", onEnded)
		}
	}, [sections.length])

	// Auto-play when section changes
	useEffect(() => {
		const audio = audioRef.current
		if (!audio || !content?.audioUrl) return

		setCurrentTime(0)
		setDuration(0)
		audio.load()
		audio.play().catch(() => {})
	}, [content?.audioUrl])

	const handleNextSection = useCallback(() => {
		setActiveSectionIdx((i) => Math.min(i + 1, sections.length - 1))
	}, [sections.length])

	const handleJumpToItem = useCallback((itemIndex: number) => {
		document
			.getElementById(`listening-item-${itemIndex}`)
			?.scrollIntoView({ behavior: "smooth", block: "center" })
	}, [])

	if (!activeQuestion || !content) return null

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{/* ---- Questions area (scrollable) ---- */}
			<div className="flex-1 overflow-y-auto">
				<div className="mx-auto max-w-3xl space-y-6 p-6">
					{content.items.map((item, index) => (
						<div key={`${activeQuestion.id}-${index}`} id={`listening-item-${index}`}>
							<ListeningMCQItem
								index={index}
								stem={item.stem}
								options={item.options}
								selectedOption={currentAnswers[String(index + 1)] ?? null}
								onSelect={(optionIndex) =>
									onSelectMCQ(activeQuestion.id, currentAnswers, index, optionIndex)
								}
							/>
						</div>
					))}
				</div>
			</div>

			{/* ---- Audio progress bar (non-interactive, no seeking) ---- */}
			<div className="border-t bg-muted/10 px-4 py-2">
				<div className="flex items-center gap-3">
					<div className="flex items-center gap-2">
						<HugeiconsIcon icon={HeadphonesIcon} className="size-4 text-muted-foreground" />
						<span className="font-mono text-xs font-semibold tabular-nums text-primary">
							{formatTime(currentTime)}
						</span>
					</div>
					<div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
						<div
							className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-300"
							style={{ width: `${progress}%` }}
						/>
					</div>
					<span className="font-mono text-xs tabular-nums text-muted-foreground">
						{formatTime(duration)}
					</span>
				</div>

				{/* Hidden audio element — no native controls, prevents seeking */}
				{/* biome-ignore lint/a11y/useMediaCaption: VSTEP listening exam audio */}
				<audio ref={audioRef} src={content.audioUrl} preload="metadata" className="hidden" />
			</div>

			{/* ---- Question numbers row ---- */}
			<div className="flex flex-wrap justify-center gap-1.5 border-t px-4 py-2.5">
				{content.items.map((_, i) => {
					const isAnswered = currentAnswers[String(i + 1)] != null
					return (
						<button
							key={i}
							type="button"
							onClick={() => handleJumpToItem(i)}
							className={cn(
								"flex size-8 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
								isAnswered
									? "border-primary bg-primary text-primary-foreground"
									: "border-border bg-background text-muted-foreground hover:bg-accent",
							)}
						>
							{i + 1}
						</button>
					)
				})}
			</div>

			{/* ---- Section tabs + next section button ---- */}
			<div className="flex items-center justify-between border-t bg-muted/5 px-4 py-2.5">
				{/* Left: current section indicator */}
				<div className="flex items-center gap-2">
					<HugeiconsIcon icon={HeadphonesIcon} className="size-4" />
					<span className="text-sm font-medium">Section {activeSectionIdx + 1}</span>
					<span className="text-xs text-muted-foreground">
						đã làm {sectionsMeta[activeSectionIdx]?.answered ?? 0}/
						{sectionsMeta[activeSectionIdx]?.total ?? 0}
					</span>
				</div>

				{/* Center: section tabs with progress */}
				<div className="flex items-center gap-1.5">
					{sectionsMeta.map((meta, i) => {
						const isActive = i === activeSectionIdx
						const pct = meta.total > 0 ? (meta.answered / meta.total) * 100 : 0
						return (
							<button
								key={i}
								type="button"
								onClick={() => setActiveSectionIdx(i)}
								className={cn(
									"relative flex items-center gap-1.5 overflow-hidden rounded-full px-3 pb-2.5 pt-1.5 text-xs font-medium transition-colors",
									isActive
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground hover:bg-muted/80",
								)}
							>
								Section {i + 1}
								<span className="opacity-80">
									{meta.answered}/{meta.total}
								</span>
								{/* Mini progress bar */}
								<span
									className={cn(
										"absolute inset-x-1 bottom-0.5 h-0.5 overflow-hidden rounded-full",
										isActive ? "bg-primary-foreground/30" : "bg-border",
									)}
								>
									<span
										className={cn(
											"block h-full rounded-full transition-[width]",
											isActive ? "bg-primary-foreground" : "bg-muted-foreground/50",
										)}
										style={{ width: `${pct}%` }}
									/>
								</span>
							</button>
						)
					})}
				</div>

				{/* Right: next section button */}
				{activeSectionIdx < sections.length - 1 ? (
					<Button size="sm" onClick={handleNextSection}>
						Section {activeSectionIdx + 2}
						<HugeiconsIcon icon={ArrowRight01Icon} className="size-4" />
					</Button>
				) : (
					<div className="w-24" />
				)}
			</div>
		</div>
	)
}
