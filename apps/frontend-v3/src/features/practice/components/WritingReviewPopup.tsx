import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Icon } from "#/components/Icon"
import { FeedbackSection, RewriteSection } from "#/features/grading/components/FeedbackSection"
import { RubricBar } from "#/features/grading/components/RubricBar"
import { writingGradingQuery } from "#/features/grading/queries"
import type { RubricCriteriaMeta } from "#/features/grading/types"
import { round } from "#/lib/utils"

const COLOR = "var(--color-skill-writing)"

interface Props {
	submissionId: string
	onClose: () => void
}

export function WritingReviewPopup({ submissionId, onClose }: Props) {
	const { data, isPending, isError, refetch } = useQuery({
		...writingGradingQuery("practice_writing", submissionId),
		refetchInterval: (query) => (query.state.data?.data ? false : 3000),
	})
	const result = data?.data
	const criteria = (data?.rubric?.criteria ?? []) as RubricCriteriaMeta[]

	function label(key: string): string {
		return criteria.find((c) => c.key === key)?.label ?? key
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
			<div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-(--radius-card) border-2 border-b-4 border-border bg-surface p-6 shadow-xl mx-4 animate-[popIn_0.25s_ease-out]">
				<div className="flex items-center justify-between mb-2">
					<h2 className="font-extrabold text-lg text-foreground">Kết quả chấm bài</h2>
					<button type="button" onClick={onClose} className="p-1 text-muted hover:text-foreground transition">
						<Icon name="close" size="sm" />
					</button>
				</div>

				{(isPending || (!result && !isError)) && (
					<div className="text-center py-8">
						<div className="flex justify-center gap-1.5 mb-3">
							<div className="w-2.5 h-2.5 rounded-full bg-skill-writing animate-[dotBounce_1.2s_ease-in-out_infinite]" />
							<div
								className="w-2.5 h-2.5 rounded-full bg-skill-writing animate-[dotBounce_1.2s_ease-in-out_infinite]"
								style={{ animationDelay: "0.2s" }}
							/>
							<div
								className="w-2.5 h-2.5 rounded-full bg-skill-writing animate-[dotBounce_1.2s_ease-in-out_infinite]"
								style={{ animationDelay: "0.4s" }}
							/>
						</div>
						<p className="text-sm font-bold text-muted">AI đang chấm bài...</p>
						<p className="text-xs text-subtle mt-1">Thường mất 10–30 giây</p>
					</div>
				)}

				{isError && (
					<div className="text-center py-6">
						<p className="text-sm text-destructive mb-3">Không thể tải kết quả.</p>
						<button type="button" onClick={() => refetch()} className="btn btn-secondary px-6">
							Thử lại
						</button>
					</div>
				)}

				{result && (
					<div className="space-y-4">
						<div className="text-center py-2">
							<p className="text-4xl font-extrabold tabular-nums" style={{ color: COLOR }}>
								{round(result.overall_band)}
							</p>
							<p className="text-xs text-muted mt-0.5">/ 10</p>
						</div>

						<div className="space-y-2">
							{Object.entries(result.rubric_scores).map(([key, score]) => (
								<RubricBar key={key} label={label(key)} score={score} max={10} color={COLOR} />
							))}
						</div>

						<FeedbackSection strengths={result.strengths} improvements={result.improvements} />
						<RewriteSection rewrites={result.rewrites} />

						<Link
							to="/grading/writing/$submissionId"
							params={{ submissionId }}
							className="block text-center py-2 px-5 font-bold text-sm rounded-(--radius-button) border-2 border-border text-muted hover:text-foreground transition uppercase"
						>
							Xem chi tiết đầy đủ
						</Link>
					</div>
				)}
			</div>
		</div>
	)
}
