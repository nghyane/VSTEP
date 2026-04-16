import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, RotateCcw } from "lucide-react"
import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "#/components/ui/button"
import { Skeleton } from "#/components/ui/skeleton"
import type { VocabTopic, VocabWord } from "#/lib/mock/vocabulary"
import { vocabularyTopicQueryOptions } from "#/lib/queries/vocabulary"
import { DEFAULT_SRS_CONFIG } from "#/lib/srs/defaults"
import { formatInterval } from "#/lib/srs/format"
import { buildQueue, nextFromQueue, queueCounts } from "#/lib/srs/queue"
import { nextState, previewIntervals } from "#/lib/srs/scheduler"
import { getAllStates, resetTopicProgress, upsertCardState } from "#/lib/srs/storage"
import type { CardState, Rating } from "#/lib/srs/types"
import { cn } from "#/lib/utils"

export const Route = createFileRoute("/_app/luyen-tap/nen-tang/tu-vung/$topicId")({
	loader: ({ context: { queryClient }, params }) =>
		queryClient.ensureQueryData(vocabularyTopicQueryOptions(params.topicId)),
	component: StudyPage,
})

function StudyPage() {
	const { topicId } = Route.useParams()
	return (
		<div className="mx-auto w-full max-w-3xl">
			<Link
				to="/luyen-tap/nen-tang/tu-vung"
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Tất cả chủ đề
			</Link>
			<Suspense fallback={<StudySkeleton />}>
				<StudySession topicId={topicId} />
			</Suspense>
		</div>
	)
}

// ─── Session ───────────────────────────────────────────────────────

function StudySession({ topicId }: { topicId: string }) {
	const { data: topic } = useSuspenseQuery(vocabularyTopicQueryOptions(topicId))
	const [version, setVersion] = useState(0)
	const [flipped, setFlipped] = useState(false)

	const session = useMemo(() => buildSession(topic, version), [topic, version])

	const handleRate = useCallback(
		(rating: Rating) => {
			if (!session.currentWord || !session.currentState) return
			const next = nextState(session.currentState, rating, DEFAULT_SRS_CONFIG, Date.now())
			upsertCardState(session.currentWord.id, next)
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

	useKeyboardShortcuts({
		flipped,
		hasCard: session.currentWord !== null,
		onShowAnswer: handleShowAnswer,
		onRate: handleRate,
	})

	return (
		<div className="mt-4 space-y-6">
			<SessionHeader topic={topic} counts={session.counts} onReset={handleReset} />
			{session.currentWord ? (
				<CardStudy
					word={session.currentWord}
					state={session.currentState}
					flipped={flipped}
					onShowAnswer={handleShowAnswer}
					onRate={handleRate}
				/>
			) : (
				<SessionComplete nextDueSeconds={session.nextDueSeconds} totalWords={topic.words.length} />
			)}
		</div>
	)
}

interface Session {
	counts: ReturnType<typeof queueCounts>
	currentWord: VocabWord | null
	currentState: CardState | null
	nextDueSeconds: number | null
}

function buildSession(topic: VocabTopic, _version: number): Session {
	const wordIds = topic.words.map((wrd) => wrd.id)
	const states = getAllStates(wordIds)
	const now = Date.now()
	const queue = buildQueue(wordIds, states, now)
	const counts = queueCounts(queue)
	const nextId = nextFromQueue(queue)
	const currentWord = nextId ? (topic.words.find((wrd) => wrd.id === nextId) ?? null) : null
	const currentState = currentWord ? (states.get(currentWord.id) ?? { kind: "new" }) : null
	const nextDueSeconds = currentWord ? null : computeSoonestDue(states, now)
	return { counts, currentWord, currentState, nextDueSeconds }
}

function computeSoonestDue(states: ReadonlyMap<string, CardState>, now: number): number | null {
	let soonest: number | null = null
	for (const state of states.values()) {
		if (state.kind === "new") continue
		if (state.dueAt <= now) continue
		if (soonest === null || state.dueAt < soonest) soonest = state.dueAt
	}
	return soonest === null ? null : Math.round((soonest - now) / 1000)
}

// ─── Header ────────────────────────────────────────────────────────

function SessionHeader({
	topic,
	counts,
	onReset,
}: {
	topic: VocabTopic
	counts: ReturnType<typeof queueCounts>
	onReset: () => void
}) {
	return (
		<div className="flex flex-wrap items-center justify-between gap-3">
			<div className="min-w-0">
				<h1 className="truncate text-2xl font-bold">{topic.name}</h1>
				<p className="text-xs text-muted-foreground">{topic.description}</p>
			</div>
			<div className="flex items-center gap-2">
				<CountChip label="Mới" value={counts.new} tone="bg-primary/10 text-primary" />
				<CountChip
					label="Đang học"
					value={counts.learning}
					tone="bg-skill-speaking/10 text-skill-speaking"
				/>
				<CountChip
					label="Ôn lại"
					value={counts.review}
					tone="bg-skill-reading/10 text-skill-reading"
				/>
				<Button
					type="button"
					variant="ghost"
					size="icon-sm"
					onClick={onReset}
					aria-label="Đặt lại tiến độ chủ đề"
					title="Đặt lại tiến độ"
				>
					<RotateCcw className="size-4" />
				</Button>
			</div>
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

// ─── Card ──────────────────────────────────────────────────────────

interface CardStudyProps {
	word: VocabWord
	state: CardState | null
	flipped: boolean
	onShowAnswer: () => void
	onRate: (rating: Rating) => void
}

function CardStudy({ word, state, flipped, onShowAnswer, onRate }: CardStudyProps) {
	const previews = useMemo(
		() => (state ? previewIntervals(state, DEFAULT_SRS_CONFIG, Date.now()) : null),
		[state],
	)

	return (
		<div className="space-y-4">
			<div className="flex min-h-[22rem] flex-col items-center justify-center rounded-3xl border bg-card p-8 shadow-sm">
				<p className="text-4xl font-bold tracking-tight">{word.word}</p>
				<p className="mt-2 text-base text-muted-foreground">{word.phonetic}</p>
				<p className="mt-1 text-xs uppercase tracking-wide text-muted-foreground">
					{word.partOfSpeech}
				</p>
				{flipped && (
					<div className="mt-6 w-full max-w-xl space-y-3 border-t pt-6 text-center">
						<p className="text-lg font-medium">{word.definition}</p>
						<p className="text-sm italic text-muted-foreground">&ldquo;{word.example}&rdquo;</p>
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
						"flex flex-col items-center justify-center gap-1 rounded-2xl px-3 py-3 text-sm font-semibold transition",
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

// ─── Complete ──────────────────────────────────────────────────────

function SessionComplete({
	nextDueSeconds,
	totalWords,
}: {
	nextDueSeconds: number | null
	totalWords: number
}) {
	return (
		<div className="flex flex-col items-center gap-3 rounded-3xl border bg-card p-12 text-center shadow-sm">
			<p className="text-xl font-bold">Hết thẻ đến hạn — bạn giỏi lắm!</p>
			<p className="max-w-md text-sm text-muted-foreground">
				{nextDueSeconds !== null
					? `Quay lại sau ${formatInterval(nextDueSeconds)} để ôn tiếp các thẻ đang học.`
					: `Bạn đã học xong cả ${totalWords} từ trong phiên này.`}
			</p>
			<Button asChild variant="outline" className="mt-2">
				<Link to="/luyen-tap/nen-tang/tu-vung">Về danh sách chủ đề</Link>
			</Button>
		</div>
	)
}

// ─── Keyboard ──────────────────────────────────────────────────────

function useKeyboardShortcuts({
	flipped,
	hasCard,
	onShowAnswer,
	onRate,
}: {
	flipped: boolean
	hasCard: boolean
	onShowAnswer: () => void
	onRate: (rating: Rating) => void
}) {
	useEffect(() => {
		if (!hasCard) return
		function handler(e: KeyboardEvent) {
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
			if (!flipped && (e.key === " " || e.key === "Enter")) {
				e.preventDefault()
				onShowAnswer()
				return
			}
			if (!flipped) return
			if (e.key === "1") onRate(1)
			else if (e.key === "2") onRate(2)
			else if (e.key === "3" || e.key === " " || e.key === "Enter") {
				e.preventDefault()
				onRate(3)
			} else if (e.key === "4") onRate(4)
		}
		window.addEventListener("keydown", handler)
		return () => window.removeEventListener("keydown", handler)
	}, [flipped, hasCard, onShowAnswer, onRate])
}

// ─── Skeleton ──────────────────────────────────────────────────────

function StudySkeleton() {
	return (
		<div className="mt-4 space-y-4">
			<Skeleton className="h-8 w-2/3" />
			<Skeleton className="h-[22rem] w-full rounded-3xl" />
			<div className="grid grid-cols-4 gap-2">
				{Array.from({ length: 4 }).map((_, i) => (
					<Skeleton key={i} className="h-14 rounded-2xl" />
				))}
			</div>
		</div>
	)
}
