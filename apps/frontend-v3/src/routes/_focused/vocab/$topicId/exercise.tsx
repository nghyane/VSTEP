import { useQuery, useQueryClient } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { useEffect } from "react"
import { ExerciseFeedback } from "#/features/vocab/components/ExerciseFeedback"
import { McqOptions, TextInput } from "#/features/vocab/components/ExerciseInput"
import { ExerciseQuestion } from "#/features/vocab/components/ExerciseQuestion"
import { FocusBar } from "#/features/vocab/components/FocusBar"
import { FocusComplete, FocusEmpty } from "#/features/vocab/components/FocusStates"
import { vocabTopicDetailQuery } from "#/features/vocab/queries"
import type { ExerciseKind } from "#/features/vocab/types"
import { useExerciseSession } from "#/features/vocab/use-exercise-session"

export const Route = createFileRoute("/_focused/vocab/$topicId/exercise")({
	validateSearch: (s: Record<string, unknown>): { kind: ExerciseKind } => {
		if (s.kind === "mcq" || s.kind === "fill_blank" || s.kind === "word_form") return { kind: s.kind }
		return { kind: "mcq" }
	},
	component: ExercisePage,
})

function ExercisePage() {
	const qc = useQueryClient()
	const { topicId } = Route.useParams()
	const { kind } = Route.useSearch()
	const { data } = useQuery(vocabTopicDetailQuery(topicId))
	const exercises = data ? data.data.exercises.filter((e) => e.kind === kind) : []
	const s = useExerciseSession(exercises, kind)
	const back = { backTo: "/luyen-tap/tu-vung/$topicId", backParams: { topicId } }

	useEffect(() => {
		if (s.done) {
			qc.removeQueries({ queryKey: ["vocab", "topics", topicId] })
			qc.removeQueries({ queryKey: ["vocab", "topics"], exact: true })
		}
	}, [s.done, qc, topicId])

	if (!data) {
		return (
			<div className="min-h-screen bg-background flex flex-col">
				<FocusBar {...back} current={0} total={0} />
				<div className="flex-1 flex items-center justify-center">
					<p className="text-muted">Đang tải...</p>
				</div>
			</div>
		)
	}

	if (s.total === 0) {
		return <FocusEmpty {...back} title="Chưa có bài tập" message="Chủ đề này chưa có bài tập loại này." />
	}

	if (s.done) {
		return <FocusComplete {...back} total={s.total} message={`Bạn đã làm xong ${s.total} bài tập.`} />
	}

	if (!s.current) return null

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<FocusBar {...back} current={s.index} total={s.total} />
			<div className="flex-1 flex items-center justify-center px-6 pb-8">
				<div className="w-full max-w-lg space-y-6">
					<ExerciseQuestion exercise={s.current} />
					{s.current.kind === "mcq" ? (
						<McqOptions
							options={s.current.payload.options}
							selected={s.selected}
							result={s.result}
							onSelect={s.select}
						/>
					) : (
						<TextInput kind={kind} value={s.textAnswer} disabled={!!s.result} onChange={s.setTextAnswer} />
					)}
					<ExerciseFeedback result={s.result} />
					{s.result ? (
						<button type="button" onClick={s.next} className="btn btn-primary w-full py-3.5 text-base">
							Tiếp tục
						</button>
					) : (
						<button
							type="button"
							disabled={s.submitting || (kind === "mcq" ? s.selected === null : !s.textAnswer.trim())}
							onClick={s.submit}
							className="btn btn-primary w-full py-3.5 text-base disabled:opacity-50"
						>
							{s.submitting ? "Đang kiểm tra..." : "Kiểm tra"}
						</button>
					)}
				</div>
			</div>
		</div>
	)
}
