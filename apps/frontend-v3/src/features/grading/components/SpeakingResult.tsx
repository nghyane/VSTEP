import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { FeedbackSection } from "#/features/grading/components/FeedbackSection"
import { RubricBar } from "#/features/grading/components/RubricBar"
import { speakingGradingQuery } from "#/features/grading/queries"
import { round } from "#/lib/utils"

const COLOR = "var(--color-skill-speaking)"

const RUBRIC_LABELS: Record<string, string> = {
	fluency: "Fluency & Coherence",
	pronunciation: "Pronunciation",
	content: "Content & Task Fulfillment",
	vocab: "Lexical Resource",
	grammar: "Grammar Range & Accuracy",
}

interface Props {
	submissionId: string
	backTo: string
}

export function SpeakingResult({ submissionId, backTo }: Props) {
	const { data, isLoading } = useQuery(speakingGradingQuery("practice_speaking", submissionId))
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

	const pronScore = result.pronunciation_report?.accuracy_score ?? 0

	return (
		<div className="space-y-6">
			<div className="card p-6 text-center">
				<p className="text-xs font-bold uppercase tracking-wide text-muted mb-1">Điểm tổng</p>
				<p className="text-5xl font-extrabold tabular-nums" style={{ color: COLOR }}>
					{round(result.overall_band)}
				</p>
				<p className="text-sm text-muted mt-1">/ 10</p>
			</div>

			{pronScore > 0 && (
				<div className="card p-4 flex items-center gap-3">
					<div
						className="w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm text-primary-foreground"
						style={{ backgroundColor: COLOR }}
					>
						{pronScore}
					</div>
					<div>
						<p className="text-sm font-bold text-foreground">Pronunciation Accuracy</p>
						<p className="text-xs text-muted">Đánh giá từ phân tích âm thanh</p>
					</div>
				</div>
			)}

			<div className="card p-6 space-y-3">
				<p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Rubric</p>
				{Object.entries(result.rubric_scores).map(([key, score]) => (
					<RubricBar key={key} label={RUBRIC_LABELS[key] ?? key} score={score} max={4} color={COLOR} />
				))}
			</div>

			<div className="card p-6">
				<FeedbackSection strengths={result.strengths} improvements={result.improvements} />
			</div>

			{result.transcript && (
				<div className="card p-6">
					<p className="text-xs font-bold uppercase tracking-wide text-muted mb-2">Transcript</p>
					<p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{result.transcript}</p>
				</div>
			)}
		</div>
	)
}
