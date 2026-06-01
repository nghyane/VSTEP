// PracticeSession — session controller cho grammar exercises.

import { RotateCcw } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { recordAnswer } from "#/features/practice/lib/grammar-mastery"
import type { GrammarPoint } from "#/mocks/grammar"
import { Button } from "#/shared/ui/button"
import { ExerciseCard } from "./GrammarExerciseCards"

interface Props {
	point: GrammarPoint
}

interface SessionResult {
	correct: number
	total: number
}

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

	if (result) return <SessionSummary result={result} onReset={handleReset} />
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
			<div className="h-1.5 overflow-hidden rounded-full bg-muted shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
				<div
					className="h-full rounded-full bg-primary transition-all"
					style={{ width: `${pct}%` }}
				/>
			</div>
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
		<div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-[oklch(0.88_0.005_260)] border-b-4 border-b-[oklch(0.75_0.01_260)] bg-card p-12 text-center">
			<div className="text-5xl font-bold tabular-nums text-primary">{pct}%</div>
			<p className="text-lg font-bold">
				Bạn trả lời đúng {result.correct}/{result.total} câu
			</p>
			<div className="w-full max-w-xs">
				<div className="h-2 overflow-hidden rounded-full bg-muted shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]">
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
				<RotateCcw className="size-4" /> Làm lại
			</Button>
		</div>
	)
}
