import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { attemptExercise } from "#/features/vocab/actions"
import { FocusBar } from "#/features/vocab/components/FocusBar"
import { FocusComplete, FocusEmpty } from "#/features/vocab/components/FocusStates"
import { vocabTopicDetailQuery } from "#/features/vocab/queries"
import { cn } from "#/lib/utils"

type ExerciseKind = "mcq" | "fill_blank" | "word_form"

export const Route = createFileRoute("/_focused/vocab/$topicId/exercise")({
	validateSearch: (s: Record<string, unknown>) => ({
		kind: (s.kind as ExerciseKind) ?? "mcq",
	}),
	component: ExercisePage,
})

function ExercisePage() {
	const { topicId } = Route.useParams()
	const { kind } = Route.useSearch()
	const { data } = useQuery(vocabTopicDetailQuery(topicId))

	const exercises = (data?.data?.exercises ?? []).filter((e) => e.kind === kind)
	const [index, setIndex] = useState(0)
	const [selected, setSelected] = useState<number | null>(null)
	const [textAnswer, setTextAnswer] = useState("")
	const [result, setResult] = useState<{ correct: boolean; explanation: string | null } | null>(null)
	const [submitting, setSubmitting] = useState(false)

	const current = exercises[index]
	const total = exercises.length
	const back = { backTo: "/luyen-tap/tu-vung/$topicId" as const, backParams: { topicId } }
	const payload = current?.payload

	async function handleSubmit() {
		if (!current || submitting) return
		setSubmitting(true)
		const answer = kind === "mcq" ? { selected_index: selected } : { text: textAnswer }
		const res = await attemptExercise(current.id, answer)
		setResult({ correct: res.data.is_correct, explanation: res.data.explanation })
		setSubmitting(false)
	}

	function handleNext() {
		setResult(null)
		setSelected(null)
		setTextAnswer("")
		setIndex((i) => i + 1)
	}

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<FocusBar {...back} current={index} total={total} />
			<div className="flex-1 flex items-center justify-center px-6 pb-8">
				{!data ? (
					<p className="text-muted">Đang tải...</p>
				) : total === 0 ? (
					<FocusEmpty {...back} title="Chưa có bài tập" message="Chủ đề này chưa có bài tập loại này." />
				) : index >= total ? (
					<FocusComplete {...back} total={total} message={`Bạn đã làm xong ${total} bài tập.`} />
				) : (
					<div className="w-full max-w-lg space-y-6">
						<ExerciseQuestion kind={kind} payload={payload} />
						<ExerciseInput kind={kind} payload={payload} selected={selected} onSelect={setSelected} textAnswer={textAnswer} onTextChange={setTextAnswer} result={result} />
						<ExerciseFeedback result={result} />
						<ExerciseAction kind={kind} selected={selected} textAnswer={textAnswer} submitting={submitting} result={result} onSubmit={handleSubmit} onNext={handleNext} />
					</div>
				)}
			</div>
		</div>
	)
}

function ExerciseQuestion({ kind, payload }: { kind: ExerciseKind; payload?: Record<string, unknown> }) {
	if (!payload) return null
	return (
		<div className="card p-6">
			{kind === "mcq" && <p className="font-bold text-lg text-foreground">{payload.prompt as string}</p>}
			{kind === "fill_blank" && <p className="font-bold text-lg text-foreground">{payload.sentence as string}</p>}
			{kind === "word_form" && (
				<>
					<p className="text-sm text-muted mb-2">{payload.instruction as string}</p>
					<p className="font-bold text-lg text-foreground">{payload.sentence as string}</p>
					<p className="text-sm text-subtle mt-2">Từ gốc: <strong className="text-foreground">{payload.root_word as string}</strong></p>
				</>
			)}
		</div>
	)
}

function ExerciseInput({ kind, payload, selected, onSelect, textAnswer, onTextChange, result }: {
	kind: ExerciseKind; payload?: Record<string, unknown>; selected: number | null; onSelect: (i: number) => void; textAnswer: string; onTextChange: (v: string) => void; result: { correct: boolean } | null
}) {
	if (kind === "mcq" && Array.isArray(payload?.options)) {
		return (
			<div className="space-y-2">
				{(payload.options as string[]).map((opt, i) => (
					<button key={opt} type="button" disabled={!!result} onClick={() => onSelect(i)}
						className={cn("card w-full p-4 text-left text-sm font-bold transition",
							result ? (result.correct && selected === i ? "border-primary bg-primary-tint text-primary" : !result.correct && selected === i ? "border-destructive bg-destructive-tint text-destructive" : "")
								: selected === i ? "border-primary bg-primary-tint text-primary" : "hover:bg-background"
						)}>
						{opt}
					</button>
				))}
			</div>
		)
	}
	return (
		<input type="text" value={textAnswer} onChange={(e) => onTextChange(e.target.value)} disabled={!!result}
			placeholder={kind === "fill_blank" ? "Điền từ..." : "Nhập dạng từ đúng..."}
			className="w-full h-12 px-4 rounded-(--radius-button) border-2 border-border-light bg-surface text-foreground text-base hover:border-border focus:border-border-focus focus:outline-none transition" />
	)
}

function ExerciseFeedback({ result }: { result: { correct: boolean; explanation: string | null } | null }) {
	if (!result) return null
	return (
		<div className={cn("card p-4", result.correct ? "border-primary bg-primary-tint" : "border-destructive bg-destructive-tint")}>
			<p className={cn("font-bold text-sm", result.correct ? "text-primary" : "text-destructive")}>
				{result.correct ? "Chính xác!" : "Chưa đúng"}
			</p>
			{result.explanation && <p className="text-sm text-muted mt-1">{result.explanation}</p>}
		</div>
	)
}

function ExerciseAction({ kind, selected, textAnswer, submitting, result, onSubmit, onNext }: {
	kind: ExerciseKind; selected: number | null; textAnswer: string; submitting: boolean; result: unknown; onSubmit: () => void; onNext: () => void
}) {
	if (result) {
		return <button type="button" onClick={onNext} className="btn btn-primary w-full py-3.5 text-base">Tiếp tục</button>
	}
	return (
		<button type="button" disabled={submitting || (kind === "mcq" ? selected === null : !textAnswer.trim())} onClick={onSubmit}
			className="btn btn-primary w-full py-3.5 text-base disabled:opacity-50">
			{submitting ? "Đang kiểm tra..." : "Kiểm tra"}
		</button>
	)
}
