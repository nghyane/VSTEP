// VocabPracticeSession — exercise session cho vocabulary (MCQ, fill-blank, word-form).

import { CheckCircle2, RotateCcw, XCircle } from "lucide-react"
import { useState } from "react"
import type {
	VocabExercise,
	VocabFillBlank,
	VocabMCQ,
	VocabTopic,
	VocabWordForm,
} from "#/mocks/vocabulary"
import { cn } from "#/shared/lib/utils"
import { Button } from "#/shared/ui/button"

const KIND_LABELS = {
	mcq: "Trắc nghiệm",
	"fill-blank": "Điền từ",
	"word-form": "Word form",
} as const

export function VocabPracticeSession({ topic }: { topic: VocabTopic }) {
	const [index, setIndex] = useState(0)
	const [answered, setAnswered] = useState(false)
	const [sessionCorrect, setSessionCorrect] = useState(0)
	const [done, setDone] = useState(false)

	const exercises = topic.exercises
	const current = exercises[index]
	const total = exercises.length

	if (total === 0)
		return <p className="text-sm text-muted-foreground">Chưa có bài tập cho chủ đề này.</p>

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
			<div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-12 text-center">
				<div className="text-5xl font-bold tabular-nums text-primary">{pct}%</div>
				<p className="text-lg font-bold">
					Đúng {sessionCorrect}/{total} câu
				</p>
				<div className="w-full max-w-xs">
					<div className="h-2 overflow-hidden rounded-full bg-muted shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
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
				<div className="h-1.5 overflow-hidden rounded-full bg-muted shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
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

function KindBadge({ kind }: { kind: keyof typeof KIND_LABELS }) {
	return (
		<span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
			{KIND_LABELS[kind]}
		</span>
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
		<div className="rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-6">
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
								"flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition active:translate-y-[3px] active:border-b active:pb-[3px]",
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
		<div className="space-y-5 rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-6">
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
		<div className="space-y-5 rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-6">
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
