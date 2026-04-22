import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Icon } from "#/components/Icon"
import { logListeningPlayed } from "#/features/exam/actions"
import { MCQQuestion } from "#/features/exam/components/MCQQuestion"
import type { ExamVersionListeningSection } from "#/features/exam/types"
import { cn } from "#/lib/utils"
import { ListeningReadinessModal } from "./ListeningReadinessModal"

interface Props {
	sections: ExamVersionListeningSection[]
	sessionId: string
	mcqAnswers: Map<string, number>
	onAnswer: (itemId: string, selectedIndex: number) => void
}

function formatTime(seconds: number): string {
	const m = Math.floor(seconds / 60)
	const s = Math.floor(seconds % 60)
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

export function ListeningPanel({ sections, sessionId, mcqAnswers, onAnswer }: Props) {
	const sorted = useMemo(() => [...sections].sort((a, b) => a.part - b.part), [sections])

	const [isReady, setIsReady] = useState(false)
	const [activeSectionIdx, setActiveSectionIdx] = useState(0)
	const [playingIdx, setPlayingIdx] = useState(-1)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)
	const audioRefs = useRef<(HTMLAudioElement | null)[]>([])
	const loggedSections = useRef<Set<string>>(new Set())

	const isPlaying = playingIdx >= 0
	const activeSection = sorted[activeSectionIdx]

	// Sync progress bar từ audio đang phát
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

	// Auto-advance sang section kế tiếp khi audio kết thúc
	useEffect(() => {
		if (!isReady) return
		const cleanups: Array<() => void> = []
		for (let i = 0; i < sorted.length; i++) {
			const audio = audioRefs.current[i]
			if (!audio) continue
			const onEnded = () => {
				if (i < sorted.length - 1) {
					setPlayingIdx(i + 1)
					setActiveSectionIdx(i + 1)
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
	}, [isReady, sorted])

	// Log khi section đầu tiên được phát
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
		setActiveSectionIdx(0)
		logPlayed(firstSection.id)
		audioRefs.current[0]?.play().catch(() => null)
	}, [isPlaying, sorted, logPlayed])

	// Khi auto-advance, log section tiếp theo
	useEffect(() => {
		if (playingIdx < 0) return
		const sec = sorted[playingIdx]
		if (sec) logPlayed(sec.id)
	}, [playingIdx, sorted, logPlayed])

	const handleNextSection = useCallback(() => {
		setActiveSectionIdx((i) => Math.min(i + 1, sorted.length - 1))
	}, [sorted.length])

	const handleJumpToItem = useCallback((itemIndex: number) => {
		document
			.getElementById(`listening-item-${itemIndex}`)
			?.scrollIntoView({ behavior: "smooth", block: "center" })
	}, [])

	const totalQuestions = sorted.reduce((sum, sec) => sum + sec.items.length, 0)
	const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0

	const sectionsMeta = useMemo(
		() =>
			sorted.map((sec) => {
				const answered = sec.items.filter((it) => mcqAnswers.has(it.id)).length
				return { part: sec.part, total: sec.items.length, answered }
			}),
		[sorted, mcqAnswers],
	)

	if (!activeSection) return null

	const activeAnswered = sectionsMeta[activeSectionIdx]?.answered ?? 0
	const activeTotal = sectionsMeta[activeSectionIdx]?.total ?? 0

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{!isReady && (
				<ListeningReadinessModal
					totalSections={sorted.length}
					totalQuestions={totalQuestions}
					onReady={() => setIsReady(true)}
				/>
			)}

			{/* Questions (scrollable) */}
			<div className="flex-1 overflow-y-auto bg-background">
				<div className="mx-auto max-w-3xl space-y-6 p-6">
					<div className="flex items-center gap-3">
						<span className="rounded-full bg-skill-listening/15 px-3 py-1 text-xs font-bold text-skill-listening">
							Phần {activeSection.part}
						</span>
						<span className="text-sm font-semibold text-foreground">{activeSection.part_title}</span>
					</div>

					{activeSection.items.map((item, idx) => (
						<div key={item.id} id={`listening-item-${idx}`}>
							<MCQQuestion
								item={item}
								index={idx}
								selectedIndex={mcqAnswers.get(item.id)}
								onSelect={onAnswer}
							/>
						</div>
					))}
				</div>
			</div>

			{/* Audio progress bar */}
			<div className="border-t-2 border-border bg-card px-4 py-2">
				<div className="flex items-center gap-3">
					{!isPlaying ? (
						<button
							type="button"
							onClick={handleStartAudio}
							className="flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 active:scale-95"
						>
							<svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
								<path d="M5 3L13 8L5 13V3Z" />
							</svg>
							Phát audio
						</button>
					) : (
						<div className="flex items-center gap-2">
							<Icon name="volume" size="xs" className="text-muted" />
							<span className="font-mono text-xs font-bold tabular-nums text-primary">
								{formatTime(currentTime)}
							</span>
							{playingIdx !== activeSectionIdx && (
								<span className="text-xs text-muted">(Part {playingIdx + 1})</span>
							)}
						</div>
					)}
					<div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-surface">
						<div
							className="absolute inset-y-0 left-0 rounded-full bg-primary transition-[width] duration-300"
							style={{ width: `${progressPct}%` }}
						/>
					</div>
					<span className="font-mono text-xs tabular-nums text-muted">{formatTime(duration)}</span>
				</div>

				{/* Hidden audio per section — preload metadata để có thể play sequentially */}
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

			{/* Question number jump buttons */}
			<div className="flex flex-wrap justify-center gap-1.5 border-t border-border bg-card px-4 py-2.5">
				{activeSection.items.map((item, i) => {
					const isAnswered = mcqAnswers.has(item.id)
					return (
						<button
							key={item.id}
							type="button"
							onClick={() => handleJumpToItem(i)}
							className={cn(
								"flex size-8 items-center justify-center rounded-lg border-2 text-sm font-bold transition-colors active:scale-95",
								isAnswered
									? "border-primary bg-primary text-white"
									: "border-border bg-surface text-muted hover:border-primary/40 hover:bg-primary/5",
							)}
						>
							{i + 1}
						</button>
					)
				})}
			</div>

			{/* Section tabs + next */}
			<div className="flex items-center justify-between gap-3 border-t border-border bg-card px-4 py-2.5">
				<div className="flex min-w-0 items-center gap-2">
					<Icon name="volume" size="xs" className="text-muted" />
					<span className="text-sm font-bold text-foreground">Part {activeSectionIdx + 1}</span>
					<span className="text-xs text-muted">
						đã làm {activeAnswered}/{activeTotal}
					</span>
				</div>

				<div className="flex items-center gap-1.5">
					{sectionsMeta.map((meta, i) => {
						const isActive = i === activeSectionIdx
						const isCurrentlyPlaying = i === playingIdx
						const pct = meta.total > 0 ? (meta.answered / meta.total) * 100 : 0
						return (
							<button
								key={sorted[i]?.id ?? i}
								type="button"
								onClick={() => setActiveSectionIdx(i)}
								className={cn(
									"relative overflow-hidden rounded-full px-3 pb-2.5 pt-1.5 text-xs font-bold transition-colors",
									isActive ? "bg-primary text-white" : "bg-surface text-muted hover:bg-surface/80",
								)}
							>
								<span className="inline-flex items-center gap-1.5">
									Part {i + 1}
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
												: "bg-primary/25"
											: isActive
												? "bg-white/30"
												: "bg-border",
									)}
								>
									<span
										className={cn(
											"block h-full rounded-full transition-[width]",
											isActive ? "bg-white" : "bg-muted/60",
										)}
										style={{ width: `${pct}%` }}
									/>
								</span>
							</button>
						)
					})}
				</div>

				{activeSectionIdx < sorted.length - 1 ? (
					<button
						type="button"
						onClick={handleNextSection}
						className="flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 active:scale-95"
					>
						Part {activeSectionIdx + 2}
						<svg viewBox="0 0 16 16" className="size-3.5" fill="currentColor" aria-hidden="true">
							<path d="M6 3l5 5-5 5V3z" />
						</svg>
					</button>
				) : (
					<div className="w-20" />
				)}
			</div>
		</div>
	)
}
