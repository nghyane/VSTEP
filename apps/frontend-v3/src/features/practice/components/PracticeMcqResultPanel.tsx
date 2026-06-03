import { ExerciseFeedbackCard } from "#/features/practice/components/ExerciseFeedbackCard"
import type { SubmitResult } from "#/features/practice/types"

interface ResultPanelConfig {
	backTo: "/luyen-tap/nghe" | "/luyen-tap/doc"
	contentId: string
	contentType: "practice_listening_exercise" | "practice_reading_exercise"
	label: string
}

interface Props {
	result: SubmitResult
	config: ResultPanelConfig
}

export function PracticeMcqResultPanel({ result, config }: Props) {
	const accuracy = result.total > 0 ? Math.round((result.score / result.total) * 100) : 0
	const incorrect = Math.max(result.total - result.score, 0)

	return (
		<div className="card p-6">
			<div className="text-center">
				<img src="/mascot/lac-happy.png" alt="" className="mx-auto h-20 w-20 object-contain" />
				<p className="mt-3 text-xs font-bold uppercase tracking-wide text-subtle">{config.label}</p>
				<p className="mt-1 text-3xl font-extrabold text-foreground">
					{result.score}/{result.total}
				</p>
				<p className="text-sm text-muted">câu đúng</p>
			</div>

			<div className="mt-5 grid grid-cols-3 gap-2">
				<div className="rounded-xl border-2 border-border bg-background p-3 text-center">
					<p className="text-[10px] font-bold uppercase leading-tight text-subtle">Độ chính xác</p>
					<p className="mt-1 text-lg font-extrabold text-foreground">{accuracy}%</p>
				</div>
				<div className="rounded-xl border-2 border-border bg-background p-3 text-center">
					<p className="text-[10px] font-bold uppercase leading-tight text-subtle">Đúng</p>
					<p className="mt-1 text-lg font-extrabold text-success">{result.score}</p>
				</div>
				<div className="rounded-xl border-2 border-border bg-background p-3 text-center">
					<p className="text-[10px] font-bold uppercase leading-tight text-subtle">Cần xem lại</p>
					<p className="mt-1 text-lg font-extrabold text-destructive">{incorrect}</p>
				</div>
			</div>

			<div className="mt-6 border-t-2 border-border pt-5">
				<p className="font-extrabold text-lg text-foreground">Đánh giá bài luyện</p>
				<p className="mt-1 mb-4 text-sm text-subtle">Góp ý để hệ thống cải thiện nội dung luyện tập.</p>
				<ExerciseFeedbackCard contentType={config.contentType} contentId={config.contentId} />
			</div>
		</div>
	)
}
