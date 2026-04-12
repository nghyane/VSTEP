import { CheckCircle2, RotateCcw, XCircle } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { Button } from "#/components/ui/button"
import { recordAnswer } from "#/lib/grammar/mastery"
import type { GrammarMCQ, GrammarPoint } from "#/lib/mock/grammar"
import { cn } from "#/lib/utils"

interface Props {
	point: GrammarPoint
}

interface SessionResult {
	correct: number
	total: number
}

export function PracticeSession({ point }: Props) {
	const [index, setIndex] = useState(0)
	const [selected, setSelected] = useState<number | null>(null)
	const [result, setResult] = useState<SessionResult | null>(null)
	const [sessionCorrect, setSessionCorrect] = useState(0)

	const exercises = point.exercises
	const current = exercises[index]
	const total = exercises.length

	const handleSelect = useCallback(
		(optionIndex: number) => {
			if (selected !== null || !current) return
			setSelected(optionIndex)
			const isCorrect = optionIndex === current.correctIndex
			recordAnswer(point.id, isCorrect)
			if (isCorrect) setSessionCorrect((c) => c + 1)
		},
		[selected, current, point.id],
	)

	const handleNext = useCallback(() => {
		if (selected === null) return
		const nextIndex = index + 1
		if (nextIndex >= total) {
			setResult({ correct: sessionCorrect, total })
			return
		}
		setIndex(nextIndex)
		setSelected(null)
	}, [selected, index, total, sessionCorrect])

	const handleReset = useCallback(() => {
		setIndex(0)
		setSelected(null)
		setSessionCorrect(0)
		setResult(null)
	}, [])

	useKeyboardShortcuts({
		hasCurrent: current !== undefined && !result,
		selected,
		onSelect: handleSelect,
		onNext: handleNext,
	})

	if (result) {
		return <SessionSummary result={result} onReset={handleReset} />
	}

	if (!current) return null

	return (
		<div className="space-y-6">
			<SessionProgress current={index + 1} total={total} correct={sessionCorrect} />
			<ExerciseCard exercise={current} selected={selected} onSelect={handleSelect} />
			{selected !== null && <NextButton onNext={handleNext} isLast={index + 1 === total} />}
		</div>
	)
}

// ─── Progress header ───────────────────────────────────────────────

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

// ─── Exercise card ─────────────────────────────────────────────────

function ExerciseCard({
	exercise,
	selected,
	onSelect,
}: {
	exercise: GrammarMCQ
	selected: number | null
	onSelect: (i: number) => void
}) {
	const answered = selected !== null
	return (
		<div className="rounded-3xl border bg-card p-8 shadow-sm">
			<p className="text-xl font-semibold leading-snug">{exercise.prompt}</p>
			<div className="mt-6 grid gap-3">
				{exercise.options.map((option, i) => (
					<OptionButton
						key={option}
						label={option}
						index={i}
						isCorrect={i === exercise.correctIndex}
						isSelected={selected === i}
						answered={answered}
						onClick={() => onSelect(i)}
					/>
				))}
			</div>
			{answered && (
				<div className="mt-5 rounded-xl border border-primary/20 bg-primary/5 p-4">
					<p className="flex items-center gap-2 text-sm font-semibold">
						{selected === exercise.correctIndex ? (
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
					<p className="mt-1 text-sm text-muted-foreground">{exercise.explanation}</p>
				</div>
			)}
		</div>
	)
}

function OptionButton({
	label,
	index,
	isCorrect,
	isSelected,
	answered,
	onClick,
}: {
	label: string
	index: number
	isCorrect: boolean
	isSelected: boolean
	answered: boolean
	onClick: () => void
}) {
	const letter = String.fromCharCode(65 + index) // A, B, C, D
	return (
		<button
			type="button"
			disabled={answered}
			onClick={onClick}
			className={cn(
				"flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition",
				!answered && "border-border bg-background hover:border-primary/60 hover:bg-primary/5",
				answered && isCorrect && "border-success bg-success/10 text-foreground",
				answered &&
					!isCorrect &&
					isSelected &&
					"border-destructive bg-destructive/10 text-foreground",
				answered && !isCorrect && !isSelected && "border-border/50 opacity-60",
			)}
		>
			<span
				className={cn(
					"flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
					!answered && "border-border text-muted-foreground",
					answered && isCorrect && "border-success bg-success text-white",
					answered && !isCorrect && isSelected && "border-destructive bg-destructive text-white",
				)}
			>
				{letter}
			</span>
			{label}
		</button>
	)
}

// ─── Next / summary ────────────────────────────────────────────────

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
			<div className="text-5xl font-bold text-primary tabular-nums">{pct}%</div>
			<p className="text-lg font-bold">
				Bạn trả lời đúng {result.correct}/{result.total} câu
			</p>
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

// ─── Keyboard ──────────────────────────────────────────────────────

function useKeyboardShortcuts({
	hasCurrent,
	selected,
	onSelect,
	onNext,
}: {
	hasCurrent: boolean
	selected: number | null
	onSelect: (i: number) => void
	onNext: () => void
}) {
	useEffect(() => {
		if (!hasCurrent) return
		function handler(e: KeyboardEvent) {
			if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
			if (selected === null) {
				if (e.key === "1") onSelect(0)
				else if (e.key === "2") onSelect(1)
				else if (e.key === "3") onSelect(2)
				else if (e.key === "4") onSelect(3)
				return
			}
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault()
				onNext()
			}
		}
		window.addEventListener("keydown", handler)
		return () => window.removeEventListener("keydown", handler)
	}, [hasCurrent, selected, onSelect, onNext])
}
