import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { FeedbackSection, RewriteSection } from "#/features/grading/components/FeedbackSection"
import { RubricBar } from "#/features/grading/components/RubricBar"
import { writingGradingQuery } from "#/features/grading/queries"
import { round } from "#/lib/utils"

const COLOR = "var(--color-skill-writing)"

const RUBRIC_LABELS: Record<string, string> = {
	task_achievement: "Task Achievement",
	coherence: "Coherence & Cohesion",
	lexical: "Lexical Resource",
	grammar: "Grammar Range & Accuracy",
}

interface Props {
	submissionId: string
	backTo: string
}

export function WritingResult({ submissionId, backTo }: Props) {
	const { data, isLoading } = useQuery(writingGradingQuery("practice_writing", submissionId))
	const result = data?.data

	if (isLoading) {
		return <p className="text-center text-muted py-12">Đang tải kết quả...</p>
	}

	if (!result) {
		return (
			<div className="text-center py-12">
				<p className="text-muted mb-2">AI đang chấm bài, vui lòng quay lại sau.</p>
				<Link to={backTo} className="text-sm font-bold text-primary">
					Quay lại
				</Link>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="card p-6 text-center">
				<p className="text-xs font-bold uppercase tracking-wide text-muted mb-1">Điểm tổng</p>
				<p className="text-5xl font-extrabold tabular-nums" style={{ color: COLOR }}>
					{round(result.overall_band)}
				</p>
				<p className="text-sm text-muted mt-1">/ 10</p>
			</div>

			<div className="card p-6 space-y-3">
				<p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Rubric</p>
				{Object.entries(result.rubric_scores).map(([key, score]) => (
					<RubricBar key={key} label={RUBRIC_LABELS[key] ?? key} score={score} max={4} color={COLOR} />
				))}
			</div>

			<div className="card p-6">
				<FeedbackSection strengths={result.strengths} improvements={result.improvements} />
			</div>

			<div className="card p-6">
				<RewriteSection rewrites={result.rewrites} />
			</div>
		</div>
	)
}
