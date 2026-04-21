import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { FocusBar } from "#/features/vocab/components/FocusBar"
import { FocusComplete, FocusEmpty } from "#/features/vocab/components/FocusStates"
import { GrammarFeedback, GrammarInput, GrammarQuestion } from "#/features/grammar/components/ExerciseUI"
import { grammarPointDetailQuery } from "#/features/grammar/queries"
import { useGrammarExerciseSession } from "#/features/grammar/use-grammar-exercise"

export const Route = createFileRoute("/_focused/grammar/$pointId/exercise")({
	component: GrammarExercisePage,
})

function GrammarExercisePage() {
	const { pointId } = Route.useParams()
	const { data } = useQuery(grammarPointDetailQuery(pointId))
	const exercises = data ? data.data.exercises : []
	const s = useGrammarExerciseSession(exercises)
	const back = { backTo: "/luyen-tap/ngu-phap/$pointId", backParams: { pointId } }

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
		return <FocusEmpty {...back} title="Chưa có bài tập" message="Điểm ngữ pháp này chưa có bài tập." />
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
					<div className="card p-6">
						<GrammarQuestion exercise={s.current} />
					</div>
					<GrammarInput exercise={s.current} selected={s.selected} textAnswer={s.textAnswer} result={s.result} onSelect={s.select} onText={s.setTextAnswer} />
					<GrammarFeedback result={s.result} />
					{s.result ? (
						<button type="button" onClick={s.next} className="btn btn-primary w-full py-3.5 text-base">Tiếp tục</button>
					) : (
						<button type="button" disabled={s.submitting || (s.current.kind === "mcq" ? s.selected === null : !s.textAnswer.trim())} onClick={s.submit} className="btn btn-primary w-full py-3.5 text-base disabled:opacity-50">
							{s.submitting ? "Đang kiểm tra..." : "Kiểm tra"}
						</button>
					)}
				</div>
			</div>
		</div>
	)
}
