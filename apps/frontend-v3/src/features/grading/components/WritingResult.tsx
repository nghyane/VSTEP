import { useQuery } from "@tanstack/react-query"
import { FeedbackSection, RewriteSection } from "#/features/grading/components/FeedbackSection"
import { RubricBar } from "#/features/grading/components/RubricBar"
import { writingGradingQuery } from "#/features/grading/queries"
import type { RubricCriteriaMeta } from "#/features/grading/types"
import { round } from "#/lib/utils"

const COLOR = "var(--color-skill-writing)"

interface Props {
	submissionId: string
}

export function WritingResult({ submissionId }: Props) {
	const { data, isLoading } = useQuery({
		...writingGradingQuery("practice_writing", submissionId),
		refetchInterval: (query) => (query.state.data?.data ? false : 3000),
	})
	const result = data?.data
	const criteria = (data?.rubric?.criteria ?? []) as RubricCriteriaMeta[]

	if (isLoading || !result) {
		return (
			<div className="text-center py-12">
				<img src="/mascot/lac-happy.png" alt="" className="w-20 h-20 mx-auto mb-4 object-contain" />
				<p className="font-bold text-lg text-foreground">AI đang chấm bài...</p>
				<p className="text-sm text-muted mt-1">Thường mất 10–30 giây, trang sẽ tự cập nhật</p>
				<div className="mt-4 w-32 h-1.5 bg-background rounded-full mx-auto overflow-hidden">
					<div className="h-full bg-skill-writing rounded-full animate-pulse" style={{ width: "60%" }} />
				</div>
			</div>
		)
	}

	function label(key: string): string {
		return criteria.find((c) => c.key === key)?.label ?? key
	}

	function max(key: string): number {
		return criteria.find((c) => c.key === key)?.max ?? 10
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
					<RubricBar key={key} label={label(key)} score={score} max={max(key)} color={COLOR} />
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
