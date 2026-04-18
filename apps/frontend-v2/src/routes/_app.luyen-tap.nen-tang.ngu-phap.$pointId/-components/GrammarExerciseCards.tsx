// GrammarExerciseCards — 4 exercise type cards dùng trong PracticeSession.

import { CheckCircle2, XCircle } from "lucide-react"
import { useEffect, useState } from "react"
import type {
	GrammarErrorCorrection,
	GrammarExercise,
	GrammarFillBlank,
	GrammarMCQ,
	GrammarRewrite,
} from "#/mocks/grammar"
import { cn } from "#/shared/lib/utils"
import { Button } from "#/shared/ui/button"

const KIND_LABELS = {
	mcq: "Trắc nghiệm",
	"error-correction": "Sửa lỗi",
	"fill-blank": "Điền từ",
	rewrite: "Viết lại",
} as const

export function ExerciseCard({
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

function KindBadge({ kind }: { kind: keyof typeof KIND_LABELS }) {
	return (
		<span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
			{KIND_LABELS[kind]}
		</span>
	)
}

export function ExplanationBox({ correct, text }: { correct: boolean; text: string }) {
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
		<div className="rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-6">
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
								"flex items-center gap-3 rounded-xl border-2 px-4 py-3.5 text-left text-sm font-medium transition active:translate-y-[3px] active:border-b active:pb-[3px]",
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
		<div className="space-y-5 rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-6">
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
		onAnswer(exercise.acceptedAnswers.some((a) => normalize(a) === normalize(value)))
	}
	return (
		<div className="space-y-5 rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-6">
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
