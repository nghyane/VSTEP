import {
	ArrowRight01Icon,
	HeadphonesIcon,
	PlayIcon,
	VolumeHighIcon,
} from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { getObjectiveAnswer } from "@/routes/_learner/exams/-components/questions/useExamAnswers"
import type { ExamSessionDetail, SubmissionAnswer } from "@/types/api"

// Normalize BE individual MCQ → grouped ListeningContent format
function normalizeOptions(options: unknown): string[] {
	if (Array.isArray(options)) return options
	if (typeof options === "object" && options !== null) {
		return Object.keys(options)
			.sort()
			.map((k) => (options as Record<string, string>)[k])
	}
	return []
}


interface VirtualSectionItem {
	questionId: string
	stem: string
	options: string[]
}

interface VirtualSection {
	part: number
	audioUrl: string
	items: VirtualSectionItem[]
}

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

// --- Readiness Modal ---

function ReadinessModal({
	totalSections,
	totalQuestions,
	onReady,
}: {
	totalSections: number
	totalQuestions: number
	onReady: () => void
}) {
	const [countdown, setCountdown] = useState(3)

	useEffect(() => {
		if (countdown <= 0) return
		const timer = setTimeout(() => setCountdown((c) => c - 1), 1000)
		return () => clearTimeout(timer)
	}, [countdown])

	return (
		<Dialog open>
			<DialogContent showCloseButton={false} className="sm:max-w-md">
				<DialogHeader className="items-center text-center">
					<div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
						<HugeiconsIcon icon={HeadphonesIcon} className="size-8 text-primary" />
					</div>
					<DialogTitle className="text-xl">Bạn đã sẵn sàng chưa?</DialogTitle>
					<DialogDescription className="text-balance text-center">
						Bạn có thể xem trước câu hỏi trước khi phát audio.
						<br />
						Hãy đảm bảo tai nghe đã được kết nối và âm lượng phù hợp.
					</DialogDescription>
				</DialogHeader>

				<div className="rounded-lg border bg-muted/50 p-3 text-center text-sm text-muted-foreground space-y-1">
					<p>
						Bài thi gồm <span className="font-medium text-foreground">{totalSections} phần</span>{" "}
						với <span className="font-medium text-foreground">{totalQuestions} câu hỏi</span>.
					</p>
					<p>
						Âm thanh mỗi phần chỉ phát{" "}
						<span className="font-medium text-foreground">một lần duy nhất</span>, không thể tua
						lại.
					</p>
				</div>

				<DialogFooter className="sm:justify-center">
					<Button size="lg" className="w-full" disabled={countdown > 0} onClick={onReady}>
						{countdown > 0 ? `Sẵn sàng (${countdown}s)` : "Bắt đầu làm bài"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}

// --- Main Panel ---

export function ListeningExamPanel({ questions, answers, onSelectMCQ }: ListeningExamPanelProps) {
	const sections = useMemo(() => {
		const sorted = [...questions].sort((a, b) => a.part - b.part)
		const grouped = new Map<number, VirtualSection>()
		for (const q of sorted) {
			const raw = q.content as unknown as Record<string, unknown>
			if (!grouped.has(q.part)) {
				grouped.set(q.part, {
					part: q.part,
					audioUrl: ((raw.audioUrl ?? raw.audioPath ?? "") as string),
					items: [],
				})
			}
			grouped.get(q.part)!.items.push({
				questionId: q.id,
				stem: (raw.stem as string) ?? "",
				options: normalizeOptions(raw.options),
			})
		}
		return [...grouped.values()]
	}, [questions])

	const [activeSectionIdx, setActiveSectionIdx] = useState(0)
	const [isReady, setIsReady] = useState(false)
	const audioRefs = useRef<(HTMLAudioElement | null)[]>([])
	const [playingIdx, setPlayingIdx] = useState(-1)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)

	const isPlaying = playingIdx >= 0

	const activeSection = sections[activeSectionIdx]

	// Per-section metadata for tabs
	const sectionsMeta = useMemo(
		() =>
			sections.map((section) => {
				const total = section.items.length
				let answered = 0
				for (const item of section.items) {
					if (getObjectiveAnswer(answers, item.questionId)["1"] != null) answered++
				}
				return { part: section.part, total, answered }
			}),
		[sections, answers],
	)

	// Sync progress bar from the PLAYING section's audio (not the viewed section)
	useEffect(() => {
		if (playingIdx < 0) {
			setCurrentTime(0)
			setDuration(0)
			return
		}

		const syncFromAudio = () => {
			const audio = audioRefs.current[playingIdx]
			if (!audio) return
			setCurrentTime(audio.currentTime)
			if (audio.duration && Number.isFinite(audio.duration)) setDuration(audio.duration)
		}

		syncFromAudio()
		const id = setInterval(syncFromAudio, 250)
		return () => clearInterval(id)
	}, [playingIdx])

	// Set up ended listeners (auto-advance to next section sequentially)
	useEffect(() => {
		if (!isReady) return

		const cleanups: (() => void)[] = []

		for (let i = 0; i < sections.length; i++) {
			const audio = audioRefs.current[i]
			if (!audio) continue

			const onEnded = () => {
				if (i < sections.length - 1) {
					setPlayingIdx(i + 1)
					setActiveSectionIdx(i + 1)
					audioRefs.current[i + 1]?.play().catch(() => {})
				}
			}

			audio.addEventListener("ended", onEnded)
			cleanups.push(() => audio.removeEventListener("ended", onEnded))
		}

		return () => {
			for (const fn of cleanups) fn()
		}
	}, [isReady, sections])

	// Start audio always from section 0, snap view to it
	const handleStartAudio = useCallback(() => {
		if (isPlaying) return
		setPlayingIdx(0)
		setActiveSectionIdx(0)
		audioRefs.current[0]?.play().catch(() => {})
	}, [isPlaying])

	const handleNextSection = useCallback(() => {
		setActiveSectionIdx((i) => Math.min(i + 1, sections.length - 1))
	}, [sections.length])

	const handleJumpToItem = useCallback((itemIndex: number) => {
		document
			.getElementById(`listening-item-${itemIndex}`)
			?.scrollIntoView({ behavior: "smooth", block: "center" })
	}, [])

	if (!activeSection) return null

	const progress = duration > 0 ? (currentTime / duration) * 100 : 0

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{!isReady && (
				<ReadinessModal
					totalSections={sections.length}
					totalQuestions={sectionsMeta.reduce((sum, s) => sum + s.total, 0)}
					onReady={() => setIsReady(true)}
				/>
			)}

			{/* ---- Questions area (scrollable) ---- */}
			<div className="flex-1 overflow-y-auto">
				<div className="mx-auto max-w-3xl space-y-6 p-6">
				{activeSection.items.map((item, index) => {
					const itemAnswer = getObjectiveAnswer(answers, item.questionId)
					return (
						<div key={item.questionId} id={`listening-item-${index}`}>
							<ListeningMCQItem
								index={index}
								stem={item.stem}
								options={item.options}
								selectedOption={itemAnswer["1"] ?? null}
								onSelect={(optionIndex) =>
									onSelectMCQ(item.questionId, itemAnswer, 0, optionIndex)
								}
							/>
						</div>
					)
				})}
				</div>
			</div>

			{/* ---- Audio progress bar (non-interactive, no seeking) ---- */}
			<div className="border-t bg-muted/10 px-4 py-2">
				<div className="flex items-center gap-3">
					{!isPlaying ? (
						<button
							type="button"
							onClick={handleStartAudio}
							className="flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
						>
							<HugeiconsIcon icon={PlayIcon} className="size-3.5" />
						</button>
					) : (
						<div className="flex items-center gap-2">
							<HugeiconsIcon icon={HeadphonesIcon} className="size-4 text-muted-foreground" />
							<span className="font-mono text-xs font-semibold tabular-nums text-primary">
								{formatTime(currentTime)}
							</span>
							{playingIdx !== activeSectionIdx && (
								<span className="text-xs text-muted-foreground">(Section {playingIdx + 1})</span>
							)}
						</div>
					)}
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

				{/* Hidden audio elements — one per section, play independently */}
				{sections.map((section, i) => (
					// biome-ignore lint/a11y/useMediaCaption: VSTEP listening exam audio
					<audio
						key={`audio-${section.part}`}
						ref={(el) => {
							audioRefs.current[i] = el
						}}
						src={section.audioUrl}
						preload="metadata"
						className="hidden"
					/>
				))}
			</div>

			{/* ---- Question numbers row ---- */}
			<div className="flex flex-wrap justify-center gap-1.5 border-t px-4 py-2.5">
				{activeSection.items.map((item, i) => {
					const isAnswered = getObjectiveAnswer(answers, item.questionId)["1"] != null
					return (
						<button
							key={item.questionId}
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
						const isCurrentlyPlaying = i === playingIdx
						const pct = meta.total > 0 ? (meta.answered / meta.total) * 100 : 0
						return (
							<button
								key={i}
								type="button"
								onClick={() => setActiveSectionIdx(i)}
								className={cn(
									"relative overflow-hidden rounded-full px-3 pb-2.5 pt-1.5 text-xs font-medium transition-colors",
									isActive
										? "bg-primary text-primary-foreground"
										: "bg-muted text-muted-foreground hover:bg-muted/80",
								)}
							>
								<span className="inline-flex items-center gap-1.5">
									{isCurrentlyPlaying && (
										<HugeiconsIcon icon={VolumeHighIcon} className="size-3.5 shrink-0" />
									)}
									Section {i + 1}
									<span className="opacity-80">
										{meta.answered}/{meta.total}
									</span>
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
