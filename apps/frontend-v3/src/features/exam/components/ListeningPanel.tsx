import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Icon } from "#/components/Icon"
import { ScrollArea } from "#/components/ScrollArea"
import { logListeningPlayed } from "#/features/exam/actions"
import { MCQQuestion } from "#/features/exam/components/MCQQuestion"
import type { ExamVersionListeningSection } from "#/features/exam/types"
import { cn } from "#/lib/utils"
import { ListeningReadinessModal } from "./ListeningReadinessModal"

interface FooterAction {
	skillLabel: string
	skillProgress: string
	isLastSkill: boolean
	isSubmitting: boolean
	onSubmit: () => void
	onNext: () => void
}

interface Props {
	sections: ExamVersionListeningSection[]
	sessionId: string
	mcqAnswers: Map<string, number>
	onAnswer: (itemId: string, selectedIndex: number) => void
	footer: FooterAction
}

function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60)
	const s = Math.floor(seconds % 60)
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function ListeningPanel({ sections, sessionId, mcqAnswers, onAnswer, footer }: Props) {
	// Sort by display_order then part
	const sorted = useMemo(
		() => [...sections].sort((a, b) => a.display_order - b.display_order || a.part - b.part),
		[sections],
	)

	// Group sections by part number → Part 1 / Part 2 / Part 3
	const partGroups = useMemo(() => {
		const map = new Map<number, ExamVersionListeningSection[]>()
		for (const sec of sorted) {
			const list = map.get(sec.part) ?? []
			list.push(sec)
			map.set(sec.part, list)
		}
		return Array.from(map.entries())
			.sort(([a], [b]) => a - b)
			.map(([part, secs]) => ({ part, sections: secs }))
	}, [sorted])

	const [isReady, setIsReady] = useState(false)
	const [activePartIdx, setActivePartIdx] = useState(0) // index trong partGroups
	const [playingIdx, setPlayingIdx] = useState(-1) // index trong sorted (toàn bộ)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)
	const audioRefs = useRef<(HTMLAudioElement | null)[]>([])
	const loggedSections = useRef<Set<string>>(new Set())

	const isPlaying = playingIdx >= 0

	// Sections thuộc part đang active
	const activeGroup = partGroups[activePartIdx]

	// Index trong sorted của section đầu tiên đang playing
	const playingPartIdx = useMemo(() => {
		if (playingIdx < 0) return -1
		const sec = sorted[playingIdx]
		if (!sec) return -1
		return partGroups.findIndex((g) => g.part === sec.part)
	}, [playingIdx, sorted, partGroups])

	// Sync progress bar
	useEffect(() => {
		if (playingIdx < 0) {
			setCurrentTime(0)
			setDuration(0)
			return
		}
		const sync = () => {
			const audio = audioRefs.current[playingIdx]
			if (!audio) return
			setCurrentTime(audio.currentTime)
			if (audio.duration && Number.isFinite(audio.duration)) setDuration(audio.duration)
		}
		sync()
		const id = setInterval(sync, 250)
		return () => clearInterval(id)
	}, [playingIdx])

	// Auto-advance sequential audio
	useEffect(() => {
		if (!isReady) return
		const cleanups: Array<() => void> = []
		for (let i = 0; i < sorted.length; i++) {
			const audio = audioRefs.current[i]
			if (!audio) continue
			const onEnded = () => {
				if (i < sorted.length - 1) {
					setPlayingIdx(i + 1)
					// Auto switch active part when audio crosses part boundary
					const nextSec = sorted[i + 1]
					if (nextSec) {
						const nextPartIdx = partGroups.findIndex((g) => g.part === nextSec.part)
						if (nextPartIdx >= 0) setActivePartIdx(nextPartIdx)
					}
					audioRefs.current[i + 1]?.play().catch(() => null)
				} else {
					setPlayingIdx(-1)
				}
			}
			audio.addEventListener("ended", onEnded)
			cleanups.push(() => audio.removeEventListener("ended", onEnded))
		}
		return () => {
			for (const fn of cleanups) fn()
		}
	}, [isReady, sorted, partGroups])

	// Log played
	const logPlayed = useCallback(
		(sectionId: string) => {
			if (loggedSections.current.has(sectionId)) return
			loggedSections.current.add(sectionId)
			logListeningPlayed(sessionId, sectionId).catch(() => null)
		},
		[sessionId],
	)

	const handleStartAudio = useCallback(() => {
		if (isPlaying) return
		const firstSection = sorted[0]
		if (!firstSection) return
		setPlayingIdx(0)
		setActivePartIdx(0)
		logPlayed(firstSection.id)
		audioRefs.current[0]?.play().catch(() => null)
	}, [isPlaying, sorted, logPlayed])

	useEffect(() => {
		if (playingIdx < 0) return
		const sec = sorted[playingIdx]
		if (sec) logPlayed(sec.id)
	}, [playingIdx, sorted, logPlayed])

	const handleNextPart = useCallback(() => {
		setActivePartIdx((i) => Math.min(i + 1, partGroups.length - 1))
	}, [partGroups.length])

	const handleJumpToItem = useCallback((globalIdx: number) => {
		document
			.getElementById(`listening-item-${globalIdx}`)
			?.scrollIntoView({ behavior: "smooth", block: "center" })
	}, [])

	const totalQuestions = sorted.reduce((sum, sec) => sum + sec.items.length, 0)
	const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0

	// Per-part meta: answered / total
	const partsMeta = useMemo(
		() =>
			partGroups.map((g) => {
				const total = g.sections.reduce((s, sec) => s + sec.items.length, 0)
				const answered = g.sections.reduce(
					(s, sec) => s + sec.items.filter((it) => mcqAnswers.has(it.id)).length,
					0,
				)
				return { part: g.part, total, answered }
			}),
		[partGroups, mcqAnswers],
	)

	// All items in active part (flattened, with global index offset)
	const activeItems = useMemo(() => {
		const items: Array<{
			item: ExamVersionListeningSection["items"][0]
			globalIdx: number
			sectionTitle: string
		}> = []
		let globalIdx = 0
		for (const sec of sorted) {
			const inActivePart = sec.part === activeGroup?.part
			for (const item of sec.items) {
				if (inActivePart) {
					items.push({ item, globalIdx, sectionTitle: sec.part_title })
				}
				globalIdx++
			}
		}
		return items
	}, [sorted, activeGroup])

	// Global offset of first item in active part (for jump buttons)
	const activePartGlobalOffset = useMemo(() => {
		let offset = 0
		for (const sec of sorted) {
			if (sec.part === activeGroup?.part) break
			offset += sec.items.length
		}
		return offset
	}, [sorted, activeGroup])

	const activePartAnswered = partsMeta[activePartIdx]?.answered ?? 0
	const activePartTotal = partsMeta[activePartIdx]?.total ?? 0

	if (partGroups.length === 0) return null

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{!isReady && (
				<ListeningReadinessModal
					totalSections={partGroups.length}
					totalQuestions={totalQuestions}
					onReady={() => setIsReady(true)}
				/>
			)}

			{/* Questions (scrollable) */}
			<ScrollArea className="flex-1 bg-background">
				<div className="mx-auto max-w-3xl space-y-6 p-6">
					{/* Part header */}
					<div className="flex items-center gap-3">
						<span className="rounded-full border-2 border-b-4 border-skill-listening/30 bg-skill-listening/10 px-3 py-1 text-xs font-extrabold text-skill-listening">
							Part {activeGroup?.part}
						</span>
					</div>

					{/* All items in this part */}
					{activeItems.map(({ item, globalIdx }) => (
						<div key={item.id} id={`listening-item-${globalIdx}`}>
							<MCQQuestion
								item={item}
								index={globalIdx - activePartGlobalOffset}
								selectedIndex={mcqAnswers.get(item.id)}
								onSelect={onAnswer}
							/>
						</div>
					))}
				</div>
			</ScrollArea>

			{/* Audio bar */}
			<div className="border-t-2 border-border bg-card px-4 py-2.5">
				<div className="flex items-center gap-3">
					{!isPlaying ? (
						<button type="button" onClick={handleStartAudio} className="btn btn-primary px-4 py-1.5 text-xs">
							<svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
								<path d="M5 3L13 8L5 13V3Z" />
							</svg>
							Phát audio
						</button>
					) : (
						<div className="flex items-center gap-2 rounded-full border-2 border-skill-listening/30 bg-skill-listening/10 px-3 py-1">
							<Icon name="volume" size="xs" className="text-skill-listening" />
							<span className="font-mono text-xs font-extrabold tabular-nums text-skill-listening">
								{formatTime(currentTime)}
							</span>
							{playingPartIdx >= 0 && playingPartIdx !== activePartIdx && (
								<span className="text-xs text-muted">(Part {sorted[playingIdx]?.part})</span>
							)}
						</div>
					)}
					<div className="relative h-2 flex-1 overflow-hidden rounded-full bg-border">
						<div
							className="absolute inset-y-0 left-0 rounded-full bg-skill-listening transition-[width] duration-300"
							style={{ width: `${progressPct}%` }}
						/>
					</div>
					<span className="font-mono text-xs tabular-nums text-muted">{formatTime(duration)}</span>
				</div>

				{/* Hidden audio per section */}
				{sorted.map((sec, i) => (
					<audio
						key={sec.id}
						ref={(el) => {
							audioRefs.current[i] = el
						}}
						src={sec.audio_url}
						preload="metadata"
						className="hidden"
					/>
				))}
			</div>

			{/* Jump buttons — items trong active part */}
			<div className="flex flex-wrap justify-center gap-1.5 border-t border-border bg-card px-4 py-2.5">
				{activeItems.map(({ item, globalIdx }, localI) => {
					const isAnswered = mcqAnswers.has(item.id)
					return (
						<button
							key={item.id}
							type="button"
							onClick={() => handleJumpToItem(globalIdx)}
							className={cn(
								"flex size-8 items-center justify-center rounded-(--radius-button) border-2 border-b-4 text-xs font-extrabold transition-all active:translate-y-[2px] active:border-b-2",
								isAnswered
									? "border-primary/70 bg-primary text-white"
									: "border-border bg-surface text-muted hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
							)}
						>
							{localI + 1}
						</button>
					)
				})}
			</div>

			{/* Part tabs + next */}
			<div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-2.5">
				<div className="flex min-w-0 items-center gap-2">
					<Icon name="volume" size="xs" className="text-skill-listening" />
					<span className="text-sm font-extrabold text-foreground">Part {activeGroup?.part}</span>
					<span className="text-xs text-muted">
						đã làm {activePartAnswered}/{activePartTotal}
					</span>
				</div>

				<div className="flex items-center gap-1.5">
					{partsMeta.map((meta, i) => {
						const isActive = i === activePartIdx
						const isCurrentlyPlaying = i === playingPartIdx
						const pct = meta.total > 0 ? (meta.answered / meta.total) * 100 : 0
						return (
							<button
								key={meta.part}
								type="button"
								onClick={() => setActivePartIdx(i)}
								className={cn(
									"relative overflow-hidden rounded-(--radius-button) border-2 border-b-4 px-3 pb-2.5 pt-1.5 text-xs font-extrabold transition-all active:translate-y-[2px] active:border-b-2",
									isActive
										? "border-primary/70 bg-primary text-white"
										: "border-border bg-surface text-muted hover:border-primary/40 hover:bg-primary/5 hover:text-primary",
								)}
							>
								<span className="inline-flex items-center gap-1.5">
									Part {meta.part}
									<span className="opacity-80">
										{meta.answered}/{meta.total}
									</span>
								</span>
								<span
									className={cn(
										"absolute inset-x-1 bottom-0.5 overflow-hidden rounded-full transition-all",
										isCurrentlyPlaying ? "h-1 animate-pulse" : "h-0.5",
										isCurrentlyPlaying
											? isActive
												? "bg-white/45"
												: "bg-primary/30"
											: isActive
												? "bg-white/30"
												: "bg-border",
									)}
								>
									<span
										className={cn(
											"block h-full rounded-full transition-[width]",
											isActive ? "bg-white" : "bg-primary/50",
										)}
										style={{ width: `${pct}%` }}
									/>
								</span>
							</button>
						)
					})}
				</div>

				{activePartIdx < partGroups.length - 1 ? (
					<button type="button" onClick={handleNextPart} className="btn btn-primary px-3 py-1.5 text-xs">
						Part {partGroups[activePartIdx + 1]?.part}
						<svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
							<path d="M6 3l5 5-5 5V3z" />
						</svg>
					</button>
				) : (
					<div className="w-20" />
				)}
			</div>

			{/* Global footer */}
			<div className="z-40 flex h-14 shrink-0 items-center justify-between border-t border-border bg-card px-5">
				<div className="w-24" />
				<p className="text-sm font-extrabold text-skill-listening">
					{footer.skillLabel}
					<span className="ml-1 text-xs font-normal text-muted">({footer.skillProgress})</span>
				</p>
				{footer.isLastSkill ? (
					<button
						type="button"
						onClick={footer.onSubmit}
						disabled={footer.isSubmitting}
						className="btn btn-primary disabled:opacity-60"
					>
						<svg
							viewBox="0 0 16 16"
							className="size-4"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.5"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<polyline points="2,8 6,12 14,4" />
						</svg>
						Nộp bài
					</button>
				) : (
					<button type="button" onClick={footer.onNext} className="btn btn-secondary">
						Phần tiếp
						<svg
							viewBox="0 0 16 16"
							className="size-4"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							aria-hidden="true"
						>
							<path d="M6 3l5 5-5 5" />
						</svg>
					</button>
				)}
			</div>
		</div>
	)
}
