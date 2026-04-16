import { CheckCircle2, RotateCcw, XCircle } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Button } from "#/components/ui/button"
import { recordAnswer } from "#/lib/grammar/mastery"
import type {
	GrammarErrorCorrection,
	GrammarExercise,
	GrammarFillBlank,
	GrammarMCQ,
	GrammarPoint,
	GrammarRewrite,
} from "#/lib/mock/grammar"
import { cn } from "#/lib/utils"

interface Props {
	point: GrammarPoint
}

interface SessionResult {
	correct: number
	total: number
}

const KIND_LABELS = {
	mcq: "Trắc nghiệm",
	"error-correction": "Sửa lỗi",
	"fill-blank": "Điền từ",
	rewrite: "Viết lại",
} as const

export function PracticeSession({ point }: Props) {
	const [index, setIndex] = useState(0)
	const [answered, setAnswered] = useState(false)
	const [result, setResult] = useState<SessionResult | null>(null)
	const [sessionCorrect, setSessionCorrect] = useState(0)

	const exercises = point.exercises
	const current = exercises[index]
	const total = exercises.length

	const handleAnswer = useCallback(
		(correct: boolean) => {
			if (answered || !current) return
			setAnswered(true)
			recordAnswer(point.id, correct)
			if (correct) setSessionCorrect((c) => c + 1)
		},
		[answered, current, point.id],
	)

	const handleNext = useCallback(() => {
		if (!answered) return
		const nextIndex = index + 1
		if (nextIndex >= total) {
			setResult({ correct: sessionCorrect, total })
			return
		}
		setIndex(nextIndex)
		setAnswered(false)
	}, [answered, index, total, sessionCorrect])

	const handleReset = useCallback(() => {
		setIndex(0)
		setAnswered(false)
		setSessionCorrect(0)
		setResult(null)
	}, [])

	useEffect(() => {
		if (!current || result) return
		function handler(e: KeyboardEvent) {
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
			if (answered && (e.key === "Enter" || e.key === " ")) {
				e.preventDefault()
				handleNext()
			}
		}
		window.addEventListener("keydown", handler)
		return () => window.removeEventListener("keydown", handler)
	}, [current, result, answered, handleNext])

	if (result) {
		return <SessionSummary result={result} onReset={handleReset} />
	}
	if (!current) return null

	return (
		<div className="space-y-6">
			<SessionProgress current={index + 1} total={total} correct={sessionCorrect} />
			<ExerciseCard
				key={current.id}
				exercise={current}
				answered={answered}
				onAnswer={handleAnswer}
			/>
			{answered && <NextButton onNext={handleNext} isLast={index + 1 === total} />}
		</div>
	)
}

// ─── Progress ──────────────────────────────────────────────────

function SessionProgress({
	current,
	total,
	correct,
}: {
	current: number
	total: number
	correct: number
}) {
	const pct = Math.round(((current - 1) / total) * 100)
	return (
		<div className="space-y-2">
			<div className="flex items-center justify-between text-xs">
				<span className="font-medium text-muted-foreground">
					Câu {current} / {total}
				</span>
				<span className="tabular-nums text-muted-foreground">
					Đúng: <strong className="text-foreground">{correct}</strong>
				</span>
			</div>
			<div className="h-1.5 overflow-hidden rounded-full bg-muted">
				<div
					className="h-full rounded-full bg-primary transition-all"
					style={{ width: `${pct}%` }}
				/>
			</div>
		</div>
	)
}

// ─── Kind badge ────────────────────────────────────────────────

function KindBadge({ kind }: { kind: keyof typeof KIND_LABELS }) {
	return (
		<span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
			{KIND_LABELS[kind]}
		</span>
	)
}

// ─── Exercise router ───────────────────────────────────────────

function ExerciseCard({
	exercise,
	answered,
	onAnswer,
}: {
	exercise: GrammarExercise
	answered: boolean
	onAnswer: (correct: boolean) => void
}) {
	switch (exercise.kind) {
		case "mcq":
			return <McqCard exercise={exercise} answered={answered} onAnswer={onAnswer} />
		case "error-correction":
			return <ErrorCorrectionCard exercise={exercise} answered={answered} onAnswer={onAnswer} />
		case "fill-blank":
			return <FillBlankCard exercise={exercise} answered={answered} onAnswer={onAnswer} />
		case "rewrite":
			return <RewriteCard exercise={exercise} answered={answered} onAnswer={onAnswer} />
	}
}

// ─── MCQ card ──────────────────────────────────────────────────

function McqCard({
	exercise,
	answered,
	onAnswer,
}: {
	exercise: GrammarMCQ
	answered: boolean
	onAnswer: (correct: boolean) => void
}) {
	const [selected, setSelected] = useState<number | null>(null)

	useEffect(() => {
		if (answered) return
		function handler(e: KeyboardEvent) {
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
			const n = Number(e.key)
			if (n >= 1 && n <= 4) {
				setSelected(n - 1)
				onAnswer(n - 1 === exercise.correctIndex)
			}
		}
		window.addEventListener("keydown", handler)
		return () => window.removeEventListener("keydown", handler)
	}, [answered, exercise.correctIndex, onAnswer])

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
				{exercise.options.map((option, i) => {
					const letter = String.fromCharCode(65 + i)
					const isOpt = selected === i
					const isCorrectOpt = i === exercise.correctIndex
					return (
						<button
							key={option}
							type="button"
							disabled={answered}
							onClick={() => handleSelect(i)}
							className={cn(
								"flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition",
								!answered &&
									"border-border bg-background hover:border-primary/60 hover:bg-primary/5",
								answered && isCorrectOpt && "border-success bg-success/10",
								answered && !isCorrectOpt && isOpt && "border-destructive bg-destructive/10",
								answered && !isCorrectOpt && !isOpt && "border-border/50 opacity-60",
							)}
						>
							<span
								className={cn(
									"flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
									!answered && "border-border text-muted-foreground",
									answered && isCorrectOpt && "border-success bg-success text-white",
									answered &&
										!isCorrectOpt &&
										isOpt &&
										"border-destructive bg-destructive text-white",
								)}
							>
								{letter}
							</span>
							{option}
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

// ─── Error correction card ─────────────────────────────────────

function ErrorCorrectionCard({
	exercise,
	answered,
	onAnswer,
}: {
	exercise: GrammarErrorCorrection
	answered: boolean
	onAnswer: (correct: boolean) => void
}) {
	const [value, setValue] = useState("")
	const before = exercise.sentence.slice(0, exercise.errorStart)
	const errorText = exercise.sentence.slice(exercise.errorStart, exercise.errorEnd)
	const after = exercise.sentence.slice(exercise.errorEnd)

	function handleSubmit() {
		if (answered || !value.trim()) return
		onAnswer(value.trim().toLowerCase() === exercise.correction.toLowerCase())
	}

	return (
		<div className="space-y-5 rounded-3xl border bg-card p-6 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
					Phần gạch chân có lỗi. Nhập từ/cụm đúng vào ô bên dưới.
				</p>
				<KindBadge kind="error-correction" />
			</div>
			<p className="text-base leading-relaxed">
				{before}
				<span className="font-medium text-destructive underline decoration-destructive decoration-2">
					{errorText}
				</span>
				{after}
			</p>
			<div className="space-y-2">
				<label htmlFor={`ec-${exercise.id}`} className="text-sm font-medium">
					Sửa thành:
				</label>
				<div className="flex gap-2">
					<input
						id={`ec-${exercise.id}`}
						type="text"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
						disabled={answered}
						placeholder="Nhập từ/cụm đúng..."
						className="flex-1 rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
					/>
					{!answered && (
						<Button type="button" onClick={handleSubmit} disabled={!value.trim()}>
							Kiểm tra
						</Button>
					)}
				</div>
			</div>
			{answered && (
				<>
					<p className="text-sm">
						Đáp án đúng: <span className="font-semibold text-success">{exercise.correction}</span>
					</p>
					<ExplanationBox
						correct={value.trim().toLowerCase() === exercise.correction.toLowerCase()}
						text={exercise.explanation}
					/>
				</>
			)}
		</div>
	)
}

// ─── Fill blank card ───────────────────────────────────────────

function FillBlankCard({
	exercise,
	answered,
	onAnswer,
}: {
	exercise: GrammarFillBlank
	answered: boolean
	onAnswer: (correct: boolean) => void
}) {
	const [value, setValue] = useState("")
	const parts = exercise.template.split("___")

	function handleSubmit() {
		if (answered || !value.trim()) return
		const normalized = value.trim().toLowerCase()
		onAnswer(exercise.acceptedAnswers.some((a) => a.toLowerCase() === normalized))
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

// ─── Rewrite card ──────────────────────────────────────────────

function RewriteCard({
	exercise,
	answered,
	onAnswer,
}: {
	exercise: GrammarRewrite
	answered: boolean
	onAnswer: (correct: boolean) => void
}) {
	const [value, setValue] = useState("")

	function normalize(s: string) {
		return s
			.trim()
			.toLowerCase()
			.replace(/\s+/g, " ")
			.replace(/[.,!?]$/, "")
	}

	function handleSubmit() {
		if (answered || !value.trim()) return
		const n = normalize(value)
		onAnswer(exercise.acceptedAnswers.some((a) => normalize(a) === n))
	}

	return (
		<div className="space-y-5 rounded-3xl border bg-card p-6 shadow-sm">
			<div className="flex items-start justify-between gap-3">
				<p className="text-sm font-semibold text-foreground">{exercise.instruction}</p>
				<KindBadge kind="rewrite" />
			</div>
			<p className="rounded-xl bg-muted/50 px-4 py-3 text-sm italic">{exercise.original}</p>
			{!answered ? (
				<div className="space-y-2">
					<label htmlFor={`rw-${exercise.id}`} className="text-sm font-medium">
						Viết lại:
					</label>
					<textarea
						id={`rw-${exercise.id}`}
						value={value}
						onChange={(e) => setValue(e.target.value)}
						rows={3}
						placeholder="Nhập câu viết lại..."
						className="w-full resize-none rounded-xl border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
					/>
					<Button type="button" onClick={handleSubmit} disabled={!value.trim()} className="w-full">
						Kiểm tra
					</Button>
				</div>
			) : (
				<div className="space-y-3">
					<p className="text-sm text-muted-foreground">
						Câu mẫu:{" "}
						<span className="font-medium text-foreground">{exercise.acceptedAnswers[0]}</span>
					</p>
					<ExplanationBox
						correct={exercise.acceptedAnswers.some((a) => normalize(a) === normalize(value))}
						text={exercise.explanation}
					/>
				</div>
			)}
		</div>
	)
}

// ─── Shared ────────────────────────────────────────────────────

function ExplanationBox({ correct, text }: { correct: boolean; text: string }) {
	return (
		<div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
			<p className="flex items-center gap-2 text-sm font-semibold">
				{correct ? (
					<>
						<CheckCircle2 className="size-4 text-success" />
						<span className="text-success">Đáp án chính xác!</span>
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

function NextButton({ onNext, isLast }: { onNext: () => void; isLast: boolean }) {
	return (
		<Button
			type="button"
			size="lg"
			onClick={onNext}
			className="h-12 w-full rounded-2xl text-base font-semibold"
		>
			{isLast ? "Kết thúc" : "Câu tiếp theo"}
			<span className="ml-2 text-xs opacity-70">(Enter)</span>
		</Button>
	)
}

function SessionSummary({ result, onReset }: { result: SessionResult; onReset: () => void }) {
	const pct = Math.round((result.correct / result.total) * 100)
	return (
		<div className="flex flex-col items-center gap-4 rounded-3xl border bg-card p-12 text-center shadow-sm">
			<div className="text-5xl font-bold tabular-nums text-primary">{pct}%</div>
			<p className="text-lg font-bold">
				Bạn trả lời đúng {result.correct}/{result.total} câu
			</p>
			<div className="w-full max-w-xs">
				<div className="h-2 overflow-hidden rounded-full bg-muted">
					<div
						className="h-full rounded-full bg-primary transition-all"
						style={{ width: `${pct}%` }}
					/>
				</div>
				<div className="mt-1.5 flex justify-between text-xs tabular-nums text-muted-foreground">
					<span>{result.correct} đúng</span>
					<span>{result.total - result.correct} sai</span>
				</div>
			</div>
			<p className="max-w-md text-sm text-muted-foreground">
				{pct >= 85
					? "Xuất sắc! Bạn đã nắm vững điểm ngữ pháp này."
					: pct >= 60
						? "Khá tốt. Hãy ôn lại lý thuyết và luyện thêm để vững hơn."
						: "Nên quay lại đọc lý thuyết, rồi làm lại bài tập nhé."}
			</p>
			<Button type="button" variant="outline" onClick={onReset} className="mt-2">
				<RotateCcw className="size-4" />
				Làm lại
			</Button>
		</div>
	)
}
