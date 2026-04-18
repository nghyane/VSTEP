import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, BookOpen, CheckCircle2, RotateCcw, Target, XCircle } from "lucide-react"
import { Suspense, useCallback, useEffect, useMemo, useState } from "react"
import { Button } from "#/components/ui/button"
import { Skeleton } from "#/components/ui/skeleton"
import type {
	VocabExercise,
	VocabFillBlank,
	VocabMCQ,
	VocabTopic,
	VocabWord,
	VocabWordForm,
} from "#/lib/mock/vocabulary"
import { vocabularyTopicQueryOptions } from "#/lib/queries/vocabulary"
import { DEFAULT_SRS_CONFIG } from "#/lib/srs/defaults"
import { formatInterval } from "#/lib/srs/format"
import { buildQueue, nextFromQueue, queueCounts } from "#/lib/srs/queue"
import { nextState, previewIntervals } from "#/lib/srs/scheduler"
import { getAllStates, resetTopicProgress, upsertCardState } from "#/lib/srs/storage"
import type { CardState, Rating } from "#/lib/srs/types"
import { cn } from "#/lib/utils"

type Tab = "flashcard" | "practice"

interface Search {
	tab: Tab
}

export const Route = createFileRoute("/_app/luyen-tap/nen-tang/tu-vung/$topicId")({
	validateSearch: (s: Record<string, unknown>): Search => ({
		tab: s.tab === "practice" ? "practice" : "flashcard",
	}),
	loader: ({ context: { queryClient }, params }) =>
		queryClient.ensureQueryData(vocabularyTopicQueryOptions(params.topicId)),
	component: StudyPage,
})

function StudyPage() {
	const { topicId } = Route.useParams()
	const { tab } = Route.useSearch()
	return (
		<div className="mx-auto w-full max-w-3xl">
			<Link
				to="/luyen-tap/nen-tang/tu-vung"
				search={{ view: "level" }}
				className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				<ArrowLeft className="size-4" />
				Tất cả chủ đề
			</Link>
			<Suspense fallback={<StudySkeleton />}>
				<StudyContent topicId={topicId} tab={tab} />
			</Suspense>
		</div>
	)
}

function StudyContent({ topicId, tab }: { topicId: string; tab: Tab }) {
	const { data: topic } = useSuspenseQuery(vocabularyTopicQueryOptions(topicId))
	return (
		<div className="mt-4 space-y-6">
			<header>
				<h1 className="text-2xl font-bold">{topic.name}</h1>
				<p className="text-xs text-muted-foreground">{topic.description}</p>
			</header>
			<div className="flex gap-1 rounded-xl bg-muted p-1">
				{(
					[
						{ key: "flashcard" as Tab, icon: BookOpen, label: "Flashcard" },
						{ key: "practice" as Tab, icon: Target, label: "Luyện tập" },
					] as const
				).map(({ key, icon: Icon, label }) => (
					<Link
						key={key}
						to="/luyen-tap/nen-tang/tu-vung/$topicId"
						params={{ topicId }}
						search={{ tab: key }}
						className={cn(
							"flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors",
							tab === key
								? "bg-card text-foreground shadow-sm"
								: "text-muted-foreground hover:text-foreground",
						)}
					>
						<Icon className="size-4" />
						{label}
					</Link>
				))}
			</div>
			{tab === "flashcard" && <FlashcardSession key={topicId} topic={topic} />}
			{tab === "practice" && <PracticeSession key={topicId} topic={topic} />}
		</div>
	)
}

// ═══════════════════════════════════════════════════════════════
// FLASHCARD SESSION (giữ nguyên SRS logic, enriched card)
// ═══════════════════════════════════════════════════════════════

function FlashcardSession({ topic }: { topic: VocabTopic }) {
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
				<div className="flex flex-col items-center gap-3 rounded-3xl border bg-card p-12 text-center shadow-sm">
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
			<div className="flex min-h-[22rem] flex-col items-center justify-center rounded-3xl border bg-card p-8 shadow-sm">
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

// ═══════════════════════════════════════════════════════════════
// PRACTICE SESSION (exercises)
// ═══════════════════════════════════════════════════════════════

const KIND_LABELS = {
	mcq: "Trắc nghiệm",
	"fill-blank": "Điền từ",
	"word-form": "Word form",
} as const

function PracticeSession({ topic }: { topic: VocabTopic }) {
	const [index, setIndex] = useState(0)
	const [answered, setAnswered] = useState(false)
	const [sessionCorrect, setSessionCorrect] = useState(0)
	const [done, setDone] = useState(false)

	const exercises = topic.exercises
	const current = exercises[index]
	const total = exercises.length

	if (total === 0) {
		return <p className="text-sm text-muted-foreground">Chưa có bài tập cho chủ đề này.</p>
	}

	const handleAnswer = (correct: boolean) => {
		if (answered) return
		setAnswered(true)
		if (correct) setSessionCorrect((c) => c + 1)
	}

	const handleNext = () => {
		if (!answered) return
		if (index + 1 >= total) {
			setDone(true)
			return
		}
		setIndex(index + 1)
		setAnswered(false)
	}

	if (done) {
		const pct = Math.round((sessionCorrect / total) * 100)
		return (
			<div className="flex flex-col items-center gap-4 rounded-3xl border bg-card p-12 text-center shadow-sm">
				<div className="text-5xl font-bold tabular-nums text-primary">{pct}%</div>
				<p className="text-lg font-bold">
					Đúng {sessionCorrect}/{total} câu
				</p>
				<div className="w-full max-w-xs">
					<div className="h-2 overflow-hidden rounded-full bg-muted">
						<div
							className="h-full rounded-full bg-primary transition-all"
							style={{ width: `${pct}%` }}
						/>
					</div>
				</div>
				<Button
					type="button"
					variant="outline"
					onClick={() => {
						setIndex(0)
						setAnswered(false)
						setSessionCorrect(0)
						setDone(false)
					}}
				>
					<RotateCcw className="size-4" /> Làm lại
				</Button>
			</div>
		)
	}

	if (!current) return null

	return (
		<div className="space-y-6">
			<div className="space-y-2">
				<div className="flex items-center justify-between text-xs">
					<span className="font-medium text-muted-foreground">
						Câu {index + 1} / {total}
					</span>
					<span className="tabular-nums text-muted-foreground">
						Đúng: <strong className="text-foreground">{sessionCorrect}</strong>
					</span>
				</div>
				<div className="h-1.5 overflow-hidden rounded-full bg-muted">
					<div
						className="h-full rounded-full bg-primary transition-all"
						style={{ width: `${Math.round((index / total) * 100)}%` }}
					/>
				</div>
			</div>
			<VocabExerciseCard
				key={current.id}
				exercise={current}
				answered={answered}
				onAnswer={handleAnswer}
			/>
			{answered && (
				<Button
					type="button"
					size="lg"
					onClick={handleNext}
					className="h-12 w-full rounded-2xl text-base font-semibold"
				>
					{index + 1 === total ? "Kết thúc" : "Câu tiếp theo"}{" "}
					<span className="ml-2 text-xs opacity-70">(Enter)</span>
				</Button>
			)}
		</div>
	)
}

function VocabExerciseCard({
	exercise,
	answered,
	onAnswer,
}: {
	exercise: VocabExercise
	answered: boolean
	onAnswer: (correct: boolean) => void
}) {
	switch (exercise.kind) {
		case "mcq":
			return <VocabMcqCard exercise={exercise} answered={answered} onAnswer={onAnswer} />
		case "fill-blank":
			return <VocabFillBlankCard exercise={exercise} answered={answered} onAnswer={onAnswer} />
		case "word-form":
			return <VocabWordFormCard exercise={exercise} answered={answered} onAnswer={onAnswer} />
	}
}

function KindBadge({ kind }: { kind: keyof typeof KIND_LABELS }) {
	return (
		<span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
			{KIND_LABELS[kind]}
		</span>
	)
}

function VocabMcqCard({
	exercise,
	answered,
	onAnswer,
}: {
	exercise: VocabMCQ
	answered: boolean
	onAnswer: (correct: boolean) => void
}) {
	const [selected, setSelected] = useState<number | null>(null)

	function handleSelect(i: number) {
		if (answered) return
		setSelected(i)
		onAnswer(i === exercise.correctIndex)
	}

	return (
		<div className="rounded-3xl border bg-card p-6 shadow-sm">
			<div className="mb-4 flex justify-end">
				<KindBadge kind="mcq" />
			</div>
			<p className="text-xl font-semibold leading-snug">{exercise.prompt}</p>
			<div className="mt-5 grid gap-3">
				{exercise.options.map((opt, i) => {
					const isCorrectOpt = i === exercise.correctIndex
					return (
						<button
							key={opt}
							type="button"
							disabled={answered}
							onClick={() => handleSelect(i)}
							className={cn(
								"flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition",
								!answered &&
									"border-border bg-background hover:border-primary/60 hover:bg-primary/5",
								answered && isCorrectOpt && "border-success bg-success/10",
								answered &&
									!isCorrectOpt &&
									selected === i &&
									"border-destructive bg-destructive/10",
								answered && !isCorrectOpt && selected !== i && "border-border/50 opacity-60",
							)}
						>
							<span
								className={cn(
									"flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
									!answered && "border-border text-muted-foreground",
									answered && isCorrectOpt && "border-success bg-success text-white",
									answered &&
										!isCorrectOpt &&
										selected === i &&
										"border-destructive bg-destructive text-white",
								)}
							>
								{String.fromCharCode(65 + i)}
							</span>
							{opt}
						</button>
					)
				})}
			</div>
			{answered && (
				<ExplanationBox correct={selected === exercise.correctIndex} text={exercise.explanation} />
			)}
		</div>
	)
}

function VocabFillBlankCard({
	exercise,
	answered,
	onAnswer,
}: {
	exercise: VocabFillBlank
	answered: boolean
	onAnswer: (correct: boolean) => void
}) {
	const [value, setValue] = useState("")
	const parts = exercise.sentence.split("___")

	function handleSubmit() {
		if (answered || !value.trim()) return
		onAnswer(exercise.acceptedAnswers.some((a) => a.toLowerCase() === value.trim().toLowerCase()))
	}

	return (
		<div className="space-y-5 rounded-3xl border bg-card p-6 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Điền vào chỗ trống
				</p>
				<KindBadge kind="fill-blank" />
			</div>
			<p className="text-base leading-relaxed">
				{parts[0]}
				<span className="inline-block min-w-[80px] border-b-2 border-primary px-2 text-center font-semibold text-primary">
					{answered
						? (exercise.acceptedAnswers[0] ?? "")
						: value || "\u00A0\u00A0\u00A0\u00A0\u00A0\u00A0"}
				</span>
				{parts[1]}
			</p>
			{!answered && (
				<div className="flex gap-2">
					<input
						type="text"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
						placeholder="Nhập câu trả lời..."
						className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
					/>
					<Button type="button" onClick={handleSubmit} disabled={!value.trim()}>
						Kiểm tra
					</Button>
				</div>
			)}
			{answered && (
				<ExplanationBox
					correct={exercise.acceptedAnswers.some(
						(a) => a.toLowerCase() === value.trim().toLowerCase(),
					)}
					text={exercise.explanation}
				/>
			)}
		</div>
	)
}

function VocabWordFormCard({
	exercise,
	answered,
	onAnswer,
}: {
	exercise: VocabWordForm
	answered: boolean
	onAnswer: (correct: boolean) => void
}) {
	const [value, setValue] = useState("")

	function handleSubmit() {
		if (answered || !value.trim()) return
		onAnswer(exercise.acceptedAnswers.some((a) => a.toLowerCase() === value.trim().toLowerCase()))
	}

	return (
		<div className="space-y-5 rounded-3xl border bg-card p-6 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<p className="text-sm font-semibold text-foreground">{exercise.instruction}</p>
				<KindBadge kind="word-form" />
			</div>
			<p className="rounded-xl bg-muted/50 px-4 py-3 text-sm">{exercise.sentence}</p>
			<p className="text-xs text-muted-foreground">
				Từ gốc: <span className="font-semibold text-foreground">{exercise.rootWord}</span>
			</p>
			{!answered ? (
				<div className="flex gap-2">
					<input
						type="text"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
						placeholder="Nhập dạng đúng..."
						className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
					/>
					<Button type="button" onClick={handleSubmit} disabled={!value.trim()}>
						Kiểm tra
					</Button>
				</div>
			) : (
				<>
					<p className="text-sm">
						Đáp án:{" "}
						<span className="font-semibold text-success">{exercise.acceptedAnswers[0]}</span>
					</p>
					<ExplanationBox
						correct={exercise.acceptedAnswers.some(
							(a) => a.toLowerCase() === value.trim().toLowerCase(),
						)}
						text={exercise.explanation}
					/>
				</>
			)}
		</div>
	)
}

function ExplanationBox({ correct, text }: { correct: boolean; text: string }) {
	return (
		<div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
			<p className="flex items-center gap-2 text-sm font-semibold">
				{correct ? (
					<>
						<CheckCircle2 className="size-4 text-success" />
						<span className="text-success">Chính xác!</span>
					</>
				) : (
					<>
						<XCircle className="size-4 text-destructive" />
						<span className="text-destructive">Chưa đúng</span>
					</>
				)}
			</p>
			<p className="mt-1 text-sm text-muted-foreground">{text}</p>
		</div>
	)
}

function StudySkeleton() {
	return (
		<div className="mt-4 space-y-4">
			<Skeleton className="h-8 w-2/3" />
			<Skeleton className="h-12 rounded-xl" />
			<Skeleton className="h-[22rem] w-full rounded-3xl" />
		</div>
	)
}
