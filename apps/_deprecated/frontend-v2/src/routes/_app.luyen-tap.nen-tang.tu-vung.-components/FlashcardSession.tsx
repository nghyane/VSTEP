// FlashcardSession — SRS flashcard học từ vựng với flip + rating buttons.

import { RotateCcw } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import type { VocabTopic, VocabWord } from "#/mocks/vocabulary"
import { DEFAULT_SRS_CONFIG } from "#/shared/lib/srs/defaults"
import { formatInterval } from "#/shared/lib/srs/format"
import { buildQueue, nextFromQueue, queueCounts } from "#/shared/lib/srs/queue"
import { nextState, previewIntervals } from "#/shared/lib/srs/scheduler"
import { getAllStates, resetTopicProgress, upsertCardState } from "#/shared/lib/srs/storage"
import type { CardState, Rating } from "#/shared/lib/srs/types"
import { cn } from "#/shared/lib/utils"
import { Button } from "#/shared/ui/button"

export function FlashcardSession({ topic }: { topic: VocabTopic }) {
	const [version, setVersion] = useState(0)
	const [flipped, setFlipped] = useState(false)

	// biome-ignore lint/correctness/useExhaustiveDependencies: version triggers re-compute after rating
	const session = useMemo(() => {
		const wordIds = topic.words.map((wrd) => wrd.id)
		const states = getAllStates(wordIds)
		const now = Date.now()
		const queue = buildQueue(wordIds, states, now)
		const counts = queueCounts(queue)
		const nextId = nextFromQueue(queue)
		const currentWord = nextId ? (topic.words.find((wrd) => wrd.id === nextId) ?? null) : null
		const currentState: CardState | null = currentWord
			? (states.get(currentWord.id) ?? { kind: "new" })
			: null
		let nextDueSeconds: number | null = null
		if (!currentWord) {
			let soonest: number | null = null
			for (const state of states.values()) {
				if (state.kind === "new" || state.dueAt <= now) continue
				if (soonest === null || state.dueAt < soonest) soonest = state.dueAt
			}
			nextDueSeconds = soonest === null ? null : Math.round((soonest - now) / 1000)
		}
		return { counts, currentWord, currentState, nextDueSeconds }
	}, [topic, version])

	const handleRate = useCallback(
		(rating: Rating) => {
			if (!session.currentWord || !session.currentState) return
			upsertCardState(
				session.currentWord.id,
				nextState(session.currentState, rating, DEFAULT_SRS_CONFIG, Date.now()),
			)
			setFlipped(false)
			setVersion((v) => v + 1)
		},
		[session],
	)

	const handleShowAnswer = useCallback(() => setFlipped(true), [])

	const handleReset = useCallback(() => {
		resetTopicProgress(topic.words.map((wrd) => wrd.id))
		setFlipped(false)
		setVersion((v) => v + 1)
	}, [topic.words])

	useEffect(() => {
		if (!session.currentWord) return
		function handler(e: KeyboardEvent) {
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
			if (!flipped && (e.key === " " || e.key === "Enter")) {
				e.preventDefault()
				handleShowAnswer()
				return
			}
			if (!flipped) return
			if (e.key === "1") handleRate(1)
			else if (e.key === "2") handleRate(2)
			else if (e.key === "3" || e.key === " " || e.key === "Enter") {
				e.preventDefault()
				handleRate(3)
			} else if (e.key === "4") handleRate(4)
		}
		window.addEventListener("keydown", handler)
		return () => window.removeEventListener("keydown", handler)
	}, [flipped, session.currentWord, handleShowAnswer, handleRate])

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-center justify-between gap-3">
				<div className="flex items-center gap-2">
					<CountChip label="Mới" value={session.counts.new} tone="bg-primary/10 text-primary" />
					<CountChip
						label="Đang học"
						value={session.counts.learning}
						tone="bg-skill-speaking/10 text-skill-speaking"
					/>
					<CountChip
						label="Ôn lại"
						value={session.counts.review}
						tone="bg-skill-reading/10 text-skill-reading"
					/>
				</div>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					onClick={handleReset}
					aria-label="Đặt lại tiến độ"
					title="Đặt lại tiến độ"
				>
					<RotateCcw className="size-4" />
				</Button>
			</div>
			{session.currentWord ? (
				<FlashCard
					word={session.currentWord}
					state={session.currentState}
					flipped={flipped}
					onShowAnswer={handleShowAnswer}
					onRate={handleRate}
				/>
			) : (
				<div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-12 text-center">
					<p className="text-xl font-bold">Hết thẻ đến hạn!</p>
					<p className="max-w-md text-sm text-muted-foreground">
						{session.nextDueSeconds !== null
							? `Quay lại sau ${formatInterval(session.nextDueSeconds)} để ôn tiếp.`
							: `Bạn đã học xong cả ${topic.words.length} từ trong phiên này.`}
					</p>
				</div>
			)}
		</div>
	)
}

function CountChip({ label, value, tone }: { label: string; value: number; tone: string }) {
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
				tone,
			)}
		>
			<span className="opacity-70">{label}</span>
			<span className="tabular-nums">{value}</span>
		</span>
	)
}

function FlashCard({
	word,
	state,
	flipped,
	onShowAnswer,
	onRate,
}: {
	word: VocabWord
	state: CardState | null
	flipped: boolean
	onShowAnswer: () => void
	onRate: (rating: Rating) => void
}) {
	const previews = useMemo(
		() => (state ? previewIntervals(state, DEFAULT_SRS_CONFIG, Date.now()) : null),
		[state],
	)

	return (
		<div className="space-y-4">
			<div className="flex min-h-[22rem] flex-col items-center justify-center rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-8">
				<p className="text-4xl font-bold tracking-tight">{word.word}</p>
				<p className="mt-2 text-base text-muted-foreground">{word.phonetic}</p>
				<p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
					{word.partOfSpeech}
				</p>
				{flipped && (
					<div className="mt-6 w-full max-w-xl space-y-4 border-t pt-6 text-center">
						<p className="text-lg font-medium">{word.definition}</p>
						<p className="text-sm italic text-muted-foreground">&ldquo;{word.example}&rdquo;</p>
						{(word.synonyms.length > 0 ||
							word.collocations.length > 0 ||
							word.wordFamily.length > 0) && (
							<div className="space-y-2 border-t pt-4 text-left text-xs text-muted-foreground">
								{word.synonyms.length > 0 && (
									<p>
										<span className="font-semibold text-foreground">Đồng nghĩa:</span>{" "}
										{word.synonyms.join(", ")}
									</p>
								)}
								{word.collocations.length > 0 && (
									<p>
										<span className="font-semibold text-foreground">Collocations:</span>{" "}
										{word.collocations.join(", ")}
									</p>
								)}
								{word.wordFamily.length > 0 && (
									<p>
										<span className="font-semibold text-foreground">Word family:</span>{" "}
										{word.wordFamily.join(", ")}
									</p>
								)}
								{word.vstepTip && <p className="text-primary">· {word.vstepTip}</p>}
							</div>
						)}
					</div>
				)}
			</div>
			{flipped ? (
				<RatingButtons previews={previews} onRate={onRate} />
			) : (
				<Button
					type="button"
					size="lg"
					className="h-12 w-full rounded-2xl text-base font-semibold"
					onClick={onShowAnswer}
				>
					Hiện đáp án <span className="ml-2 text-xs opacity-70">(Space)</span>
				</Button>
			)}
		</div>
	)
}

function RatingButtons({
	previews,
	onRate,
}: {
	previews: ReturnType<typeof previewIntervals> | null
	onRate: (rating: Rating) => void
}) {
	const buttons: Array<{ rating: Rating; label: string; tone: string; seconds: number }> = [
		{
			rating: 1,
			label: "Quên",
			tone: "bg-destructive text-white hover:bg-destructive/90",
			seconds: previews?.again ?? 0,
		},
		{
			rating: 2,
			label: "Khó",
			tone: "bg-warning text-warning-foreground hover:bg-warning/90",
			seconds: previews?.hard ?? 0,
		},
		{
			rating: 3,
			label: "Tốt",
			tone: "bg-primary text-primary-foreground hover:bg-primary/90",
			seconds: previews?.good ?? 0,
		},
		{
			rating: 4,
			label: "Dễ",
			tone: "bg-success text-success-foreground hover:bg-success/90",
			seconds: previews?.easy ?? 0,
		},
	]
	return (
		<div className="grid grid-cols-4 gap-2">
			{buttons.map((btn) => (
				<button
					type="button"
					key={btn.rating}
					onClick={() => onRate(btn.rating)}
					className={cn(
						"flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-3 text-sm font-semibold transition active:translate-y-[3px] active:border-b active:pb-[3px]",
						btn.tone,
					)}
				>
					<span className="tabular-nums text-xs opacity-80">{formatInterval(btn.seconds)}</span>
					<span>
						{btn.label} <span className="opacity-70">({btn.rating})</span>
					</span>
				</button>
			))}
		</div>
	)
}
