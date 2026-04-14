import { ChevronRight, Headphones, Play, Volume2 } from "lucide-react"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { Button } from "#/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "#/components/ui/dialog"
import type { MCQAnswerMap, MockListeningSection } from "#/lib/mock/exam-session"
import { cn } from "#/lib/utils"

const LETTERS = "ABCD"

// ─── Readiness modal ──────────────────────────────────────────────────────────

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
		const id = setTimeout(() => setCountdown((c) => c - 1), 1000)
		return () => clearTimeout(id)
	}, [countdown])

	return (
		<Dialog open>
			<DialogContent showCloseButton={false} className="sm:max-w-md">
				<DialogHeader className="items-center text-center">
					<div className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary/10">
						<Headphones className="size-8 text-primary" />
					</div>
					<DialogTitle className="text-xl">Bạn đã sẵn sàng chưa?</DialogTitle>
					<DialogDescription className="text-balance text-center">
						Bạn có thể xem trước câu hỏi trước khi phát audio.
						<br />
						Hãy đảm bảo tai nghe đã được kết nối và âm lượng phù hợp.
					</DialogDescription>
				</DialogHeader>
				<div className="space-y-1 rounded-lg border bg-muted/50 p-3 text-center text-sm text-muted-foreground">
					<p>
						Bài thi gồm{" "}
						<span className="font-medium text-foreground">{totalSections} phần</span> với{" "}
						<span className="font-medium text-foreground">{totalQuestions} câu hỏi</span>.
					</p>
					<p>
						Âm thanh mỗi phần chỉ phát{" "}
						<span className="font-medium text-foreground">một lần duy nhất</span>, không thể tua lại.
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

// ─── MCQ item ─────────────────────────────────────────────────────────────────

function MCQItem({
	index,
	stem,
	options,
	selected,
	onSelect,
}: {
	index: number
	stem: string
	options: string[]
	selected: string | null
	onSelect: (letter: string) => void
}) {
	return (
		<div className="space-y-2">
			<p className="text-sm font-medium">
				Câu {index + 1}. {stem}
			</p>
			<div className="grid gap-2 sm:grid-cols-2">
				{options.map((opt, oi) => {
					const letter = LETTERS[oi] ?? String(oi + 1)
					const isSelected = selected === letter
					return (
					<button
						key={`${index}-${oi}`}
						type="button"
						onClick={() => onSelect(letter)}
						className={cn(
							"flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left text-sm transition-all",
							isSelected
								? "border-primary border-b-2 border-b-primary/60 bg-primary/5 shadow-sm"
								: "border-border hover:border-primary/40 hover:bg-muted/30",
						)}
					>
						<span
							className={cn(
								"flex size-6 shrink-0 items-center justify-center rounded-lg text-xs font-semibold",
								isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
	sections: MockListeningSection[]
	answers: MCQAnswerMap
	onAnswer: (sectionId: string, itemIndex: number, letter: string) => void
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function ListeningExamPanel({ sections, answers, onAnswer }: Props) {
	const sorted = useMemo(() => [...sections].sort((a, b) => a.part - b.part), [sections])

	const [isReady, setIsReady] = useState(false)
	const [activeSectionIdx, setActiveSectionIdx] = useState(0)
	const [playingIdx, setPlayingIdx] = useState(-1)
	const [currentTime, setCurrentTime] = useState(0)
	const [duration, setDuration] = useState(0)
	const audioRefs = useRef<(HTMLAudioElement | null)[]>([])

	const isPlaying = playingIdx >= 0
	const activeSection = sorted[activeSectionIdx]
	const currentAnswers = activeSection ? (answers.get(activeSection.id) ?? {}) : {}

	// Sync progress bar from playing section
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

	// Auto-advance sections when audio ends
	useEffect(() => {
		if (!isReady) return
		const cleanups: (() => void)[] = []
		for (let i = 0; i < sorted.length; i++) {
			const audio = audioRefs.current[i]
			if (!audio) continue
			const onEnded = () => {
				if (i < sorted.length - 1) {
					setPlayingIdx(i + 1)
					setActiveSectionIdx(i + 1)
					audioRefs.current[i + 1]?.play().catch(() => {})
				}
			}
			audio.addEventListener("ended", onEnded)
			cleanups.push(() => audio.removeEventListener("ended", onEnded))
		}
		return () => cleanups.forEach((fn) => fn())
	}, [isReady, sorted])

	const handleStartAudio = useCallback(() => {
		if (isPlaying) return
		setPlayingIdx(0)
		setActiveSectionIdx(0)
		audioRefs.current[0]?.play().catch(() => {})
	}, [isPlaying])

	const handleNextSection = useCallback(() => {
		setActiveSectionIdx((i) => Math.min(i + 1, sorted.length - 1))
	}, [sorted.length])

	const handleJumpToItem = useCallback((itemIndex: number) => {
		document
			.getElementById(`listening-item-${itemIndex}`)
			?.scrollIntoView({ behavior: "smooth", block: "center" })
	}, [])

	const totalQuestions = sorted.reduce((s, sec) => s + sec.items.length, 0)
	const progress = duration > 0 ? (currentTime / duration) * 100 : 0

	const sectionsMeta = useMemo(
		() =>
			sorted.map((sec) => {
				const a = answers.get(sec.id) ?? {}
				return { part: sec.part, total: sec.items.length, answered: Object.keys(a).length }
			}),
		[sorted, answers],
	)

	const fmt = (s: number) => {
		const m = Math.floor(s / 60)
		const sec = Math.floor(s % 60)
		return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
	}

	if (!activeSection) return null

	return (
		<div className="flex flex-1 flex-col overflow-hidden">
			{!isReady && (
				<ReadinessModal
					totalSections={sorted.length}
					totalQuestions={totalQuestions}
					onReady={() => setIsReady(true)}
				/>
			)}

			{/* Questions (scrollable) */}
			<div className="flex-1 overflow-y-auto">
				<div className="mx-auto max-w-3xl space-y-6 p-6">
					{activeSection.items.map((item, idx) => (
						<div key={`${activeSection.id}-${idx}`} id={`listening-item-${idx}`}>
							<MCQItem
								index={idx}
								stem={item.stem}
								options={item.options}
								selected={currentAnswers[String(idx + 1)] ?? null}
								onSelect={(letter) => onAnswer(activeSection.id, idx, letter)}
							/>
						</div>
					))}
				</div>
			</div>

		{/* Audio progress bar */}
		<div className="border-t-2 bg-card px-4 py-2">
				<div className="flex items-center gap-3">
					{!isPlaying ? (
						<button
							type="button"
							onClick={handleStartAudio}
							className="flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
						>
							<Play className="size-3.5" />
							Phát audio
						</button>
					) : (
						<div className="flex items-center gap-2">
							<Headphones className="size-4 text-muted-foreground" />
							<span className="font-mono text-xs font-semibold tabular-nums text-primary">
								{fmt(currentTime)}
							</span>
							{playingIdx !== activeSectionIdx && (
								<span className="text-xs text-muted-foreground">(Part {playingIdx + 1})</span>
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
						{fmt(duration)}
					</span>
				</div>

				{/* Hidden audio per section */}
				{sorted.map((sec, i) => (
					// biome-ignore lint/a11y/useMediaCaption: VSTEP listening audio
					<audio
						key={sec.id}
						ref={(el) => {
							audioRefs.current[i] = el
						}}
						src={sec.audioUrl}
						preload="metadata"
						className="hidden"
					/>
				))}
			</div>

		{/* Question number buttons */}
		<div className="flex flex-wrap justify-center gap-1.5 border-t px-4 py-2.5">
			{activeSection.items.map((_, i) => {
				const isAnswered = currentAnswers[String(i + 1)] != null
				return (
					<button
						key={i}
						type="button"
						onClick={() => handleJumpToItem(i)}
						className={cn(
							"flex size-8 items-center justify-center rounded-lg border text-sm font-medium transition-all",
							isAnswered
								? "border-primary border-b-2 border-b-primary/60 bg-primary text-primary-foreground shadow-sm"
								: "border-border bg-background text-muted-foreground hover:border-primary/30 hover:bg-accent",
						)}
					>
						{i + 1}
					</button>
				)
			})}
		</div>

		{/* Section tabs + next button */}
		<div className="flex items-center justify-between border-t bg-card px-4 py-2.5">
				<div className="flex items-center gap-2">
					<Headphones className="size-4" />
					<span className="text-sm font-medium">Part {activeSectionIdx + 1}</span>
					<span className="text-xs text-muted-foreground">
						đã làm {sectionsMeta[activeSectionIdx]?.answered ?? 0}/
						{sectionsMeta[activeSectionIdx]?.total ?? 0}
					</span>
				</div>

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
									{isCurrentlyPlaying && <Volume2 className="size-3.5 shrink-0" />}
									Part {i + 1}
									<span className="opacity-80">
										{meta.answered}/{meta.total}
									</span>
								</span>
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

				{activeSectionIdx < sorted.length - 1 ? (
					<Button size="sm" onClick={handleNextSection}>
						Part {activeSectionIdx + 2}
						<ChevronRight className="size-4" />
					</Button>
				) : (
					<div className="w-24" />
				)}
			</div>
		</div>
	)
}
