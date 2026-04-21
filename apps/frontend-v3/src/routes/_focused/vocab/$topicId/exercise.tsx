import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import { ExerciseFeedback } from "#/features/vocab/components/ExerciseFeedback"
import { McqOptions, TextInput } from "#/features/vocab/components/ExerciseInput"
import { ExerciseQuestion } from "#/features/vocab/components/ExerciseQuestion"
import { FocusBar } from "#/features/vocab/components/FocusBar"
import { FocusComplete, FocusEmpty } from "#/features/vocab/components/FocusStates"
import { vocabTopicDetailQuery } from "#/features/vocab/queries"
import { type ExerciseKind, useExerciseSession } from "#/features/vocab/use-exercise-session"

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
	const s = useExerciseSession(exercises, kind)

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<FocusBar backTo="/luyen-tap/tu-vung/$topicId" backParams={{ topicId }} current={s.index} total={s.total} />
			<div className="flex-1 flex items-center justify-center px-6 pb-8">
				{!data ? (
					<p className="text-muted">Đang tải...</p>
				) : s.total === 0 ? (
					<FocusEmpty backTo="/luyen-tap/tu-vung/$topicId" backParams={{ topicId }} title="Chưa có bài tập" message="Chủ đề này chưa có bài tập loại này." />
				) : s.done ? (
					<FocusComplete backTo="/luyen-tap/tu-vung/$topicId" backParams={{ topicId }} total={s.total} message={`Bạn đã làm xong ${s.total} bài tập.`} />
				) : (
					<div className="w-full max-w-lg space-y-6">
						<ExerciseQuestion kind={kind} payload={s.payload} />
						{kind === "mcq" && Array.isArray(s.payload?.options) ? (
							<McqOptions options={s.payload.options as string[]} selected={s.selected} result={s.result} onSelect={s.select} />
						) : (
							<TextInput kind={kind} value={s.textAnswer} disabled={!!s.result} onChange={s.setTextAnswer} />
						)}
						<ExerciseFeedback result={s.result} />
						{s.result ? (
							<button type="button" onClick={s.next} className="btn btn-primary w-full py-3.5 text-base">Tiếp tục</button>
						) : (
							<button type="button" disabled={s.submitting || (kind === "mcq" ? s.selected === null : !s.textAnswer.trim())} onClick={s.submit} className="btn btn-primary w-full py-3.5 text-base disabled:opacity-50">
								{s.submitting ? "Đang kiểm tra..." : "Kiểm tra"}
							</button>
						)}
					</div>
				)}
			</div>
		</div>
	)
}
