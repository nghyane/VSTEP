import { useMutation } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Icon } from "#/components/Icon"
import { FeedbackSection, RewriteSection } from "#/features/grading/components/FeedbackSection"
import { InsightsSection } from "#/features/grading/components/InsightsSection"
import { RubricBar } from "#/features/grading/components/RubricBar"
import type { RubricCriteriaMeta } from "#/features/grading/types"
import { useGradingSSE } from "#/features/grading/use-grading-sse"
import { requestWritingFeedback } from "#/features/practice/actions"
import type { WritingPromptDetail } from "#/features/practice/types"
import { round } from "#/lib/utils"

const COLOR = "var(--color-skill-writing)"

interface Props {
	prompt: WritingPromptDetail
	submissionId: string
	jobId: string
}

export function WritingGradingScreen({ prompt, submissionId, jobId }: Props) {
	const sse = useGradingSSE(jobId, true)
	const feedbackMutation = useMutation({ mutationFn: () => requestWritingFeedback(submissionId) })

	const loading = sse.status === "connecting" || sse.status === "streaming"
	const failed = sse.status === "failed"
	const scores = sse.scores
	const hasFeedback = sse.feedback !== null

	if (failed) {
		return (
			<div className="flex flex-col items-center justify-center h-screen gap-4 p-6 text-center">
				<img src="/mascot/lac-sad.png" alt="" className="w-20 h-20 object-contain" />
				<p className="font-bold text-lg text-foreground">Có lỗi khi chấm bài</p>
				<p className="text-sm text-subtle">{sse.error ?? "Vui lòng thử lại sau."}</p>
				<Link to="/luyen-tap/viet" className="text-sm font-bold text-skill-writing">
					Quay lại
				</Link>
			</div>
		)
	}

	if (loading) {
		return (
			<div className="flex flex-col h-screen bg-background">
				<Header prompt={prompt} />
				<div className="flex-1 flex items-center justify-center">
					<div className="text-center space-y-6">
						<img src="/mascot/lac-happy.png" alt="" className="w-24 h-24 mx-auto object-contain" />
						<div>
							<p className="font-bold text-lg text-foreground mb-1">
								{sse.status === "connecting" ? "Đang kết nối..." : "AI đang chấm bài..."}
							</p>
							<p className="text-sm text-subtle">
								{sse.progress.length > 0 ? "Đang phân tích ngữ pháp, từ vựng..." : "Thường mất 10–30 giây"}
							</p>
						</div>
						<div className="w-48 h-1.5 bg-background rounded-full mx-auto overflow-hidden">
							<div className="h-full bg-skill-writing rounded-full animate-pulse" style={{ width: "70%" }} />
						</div>
					</div>
				</div>
			</div>
		)
	}

	if (!scores) return null

	const insights = (scores.annotations?._insights ?? null) as Record<
		string,
		{ label: string; detail: string }
	> | null
	const rubricCriteria = [
		{ key: "grammar", label: "Ngữ pháp", max: 10 },
		{ key: "vocabulary", label: "Từ vựng", max: 10 },
		{ key: "task_fulfillment", label: "Hoàn thành yêu cầu", max: 10 },
		{ key: "organization", label: "Tổ chức bài viết", max: 10 },
	] satisfies RubricCriteriaMeta[]

	function label(key: string) {
		return rubricCriteria.find((c) => c.key === key)?.label ?? key
	}

	function max(key: string) {
		return rubricCriteria.find((c) => c.key === key)?.max ?? 10
	}

	return (
		<div className="flex flex-col h-screen bg-background">
			<Header prompt={prompt} />
			<div className="flex-1 overflow-y-auto">
				<div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
					<div className="card p-6 text-center">
						<p className="text-xs font-bold uppercase tracking-wide text-subtle mb-1">Điểm tổng</p>
						<p className="text-5xl font-extrabold tabular-nums" style={{ color: COLOR }}>
							{round(scores.overall_band)}
						</p>
						<p className="text-sm text-subtle mt-1">/ 10</p>
					</div>

					<div className="card p-6 space-y-3">
						<p className="text-xs font-bold uppercase tracking-wide text-subtle mb-2">Rubric</p>
						{Object.entries(scores.rubric_scores).map(([key, score]) => (
							<RubricBar key={key} label={label(key)} score={score} max={max(key)} color={COLOR} />
						))}
					</div>

					{insights && Object.keys(insights).length > 0 && (
						<InsightsSection insights={insights} scores={scores.rubric_scores} color={COLOR} />
					)}

					{hasFeedback ? (
						<>
							<div className="card p-6">
								<FeedbackSection strengths={[]} improvements={[]} />
							</div>
							<div className="card p-6">
								<RewriteSection rewrites={[]} />
							</div>
						</>
					) : (
						<div className="card p-6 text-center space-y-4">
							<img src="/mascot/lac-happy.png" alt="" className="w-16 h-16 mx-auto object-contain" />
							<p className="text-sm font-bold text-foreground">Bạn muốn AI đánh giá chi tiết?</p>
							<p className="text-xs text-subtle">
								Nhận phân tích chuyên sâu, gợi ý cải thiện và bài viết mẫu.
							</p>
							<button
								type="button"
								onClick={() => feedbackMutation.mutate()}
								disabled={feedbackMutation.isPending}
								className="inline-flex items-center gap-2 px-5 py-2.5 rounded-(--radius-button) font-bold text-sm text-white transition-opacity disabled:opacity-50"
								style={{ backgroundColor: COLOR, boxShadow: `0 4px 0 ${COLOR}80` }}
							>
								{feedbackMutation.isPending ? "Đang yêu cầu..." : "Yêu cầu AI đánh giá"}
							</button>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}

function Header({ prompt }: { prompt: WritingPromptDetail }) {
	return (
		<div className="flex items-center gap-3 border-b-2 border-border bg-surface px-4 py-3 shrink-0">
			<Link to="/luyen-tap/viet" className="p-1 hover:opacity-70 shrink-0">
				<Icon name="back" size="sm" className="text-muted" />
			</Link>
			<span className="text-[10px] font-bold text-skill-writing bg-skill-writing/15 px-1.5 py-0.5 rounded shrink-0">
				Task {prompt.part}
			</span>
			<div className="flex-1 min-w-0">
				<p className="text-sm font-bold text-foreground truncate">{prompt.title}</p>
			</div>
		</div>
	)
}
