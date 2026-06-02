import { useQuery, useQueryClient } from "@tanstack/react-query"
import { HTTPError } from "ky"
import { useEffect } from "react"
import { Icon, StaticIcon } from "#/components/Icon"
import { appConfigQuery } from "#/features/config/queries"
import { type ConversationReview, getConversationReview } from "#/features/practice/actions"

interface Props {
	sessionId: string
	turnCount: number
	onClose: () => void
}

function ReviewContent({ review }: { review: ConversationReview }) {
	return (
		<div className="space-y-4">
			{review.strengths.length > 0 && (
				<div className="rounded-(--radius-card) border-2 border-b-4 border-success/30 bg-success/5 p-4">
					<p className="text-xs font-extrabold text-success uppercase tracking-wider mb-2">Điểm mạnh</p>
					<ul className="space-y-1.5">
						{review.strengths.map((s) => (
							<li key={s} className="flex items-start gap-2 text-sm text-foreground">
								<Icon name="check" size="xs" className="text-success shrink-0 mt-0.5" />
								{s}
							</li>
						))}
					</ul>
				</div>
			)}

			{review.improvements.length > 0 && (
				<div className="rounded-(--radius-card) border-2 border-b-4 border-warning/30 bg-warning/5 p-4">
					<p className="text-xs font-extrabold text-warning uppercase tracking-wider mb-2">Cần cải thiện</p>
					<ul className="space-y-1.5">
						{review.improvements.map((s) => (
							<li key={s} className="flex items-start gap-2 text-sm text-foreground">
								<Icon name="lightning" size="xs" className="text-warning shrink-0 mt-0.5" />
								{s}
							</li>
						))}
					</ul>
				</div>
			)}

			{review.corrected_sentences.length > 0 && (
				<div className="rounded-(--radius-card) border-2 border-b-4 border-border bg-surface p-4">
					<p className="text-xs font-extrabold text-muted uppercase tracking-wider mb-3">Sửa câu</p>
					<div className="space-y-3">
						{review.corrected_sentences.map((c) => (
							<div key={c.original} className="space-y-1">
								<p className="text-sm text-destructive line-through">{c.original}</p>
								<p className="text-sm font-bold text-success">{c.corrected}</p>
								<p className="text-xs text-muted italic">{c.explanation}</p>
							</div>
						))}
					</div>
				</div>
			)}

			{review.tip && (
				<div className="rounded-(--radius-card) border-2 border-b-4 border-skill-speaking/30 bg-skill-speaking/5 p-4">
					<p className="text-xs font-extrabold text-skill-speaking uppercase tracking-wider mb-1.5">
						Mẹo luyện tập
					</p>
					<p className="text-sm text-foreground">{review.tip}</p>
				</div>
			)}
		</div>
	)
}

export function ConversationReviewPopup({ sessionId, turnCount, onClose }: Props) {
	const queryClient = useQueryClient()
	const { data: configData } = useQuery(appConfigQuery)
	const { data, isPending, isError, error, refetch } = useQuery({
		queryKey: ["conversation-review", sessionId],
		queryFn: () => getConversationReview(sessionId),
	})
	const feedbackCost = configData?.data.pricing.practice.feedback_cost_coins ?? 0

	useEffect(() => {
		if (!data) return
		queryClient.invalidateQueries({ queryKey: ["wallet", "balance"] })
	}, [data, queryClient])

	let errorMsg = "Không thể tải đánh giá."
	if (error instanceof HTTPError) {
		const status = error.response.status
		if (status === 503) errorMsg = "AI tạm thời không phản hồi. Vui lòng thử lại sau."
		else if (status === 403) errorMsg = "Bạn không có quyền xem đánh giá này."
		else errorMsg = error.message || `Lỗi server (${status}). Vui lòng thử lại.`
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
			<div className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-(--radius-card) border-2 border-b-4 border-border bg-surface p-6 shadow-xl mx-4 animate-[popIn_0.25s_ease-out] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
				<div className="flex items-center justify-between mb-2">
					<h2 className="font-extrabold text-lg text-foreground">Đánh giá của AI</h2>
					<button type="button" onClick={onClose} className="p-1 text-muted hover:text-foreground transition">
						<Icon name="close" size="sm" />
					</button>
				</div>
				<p className="text-xs text-muted mb-4">
					Bạn đã hoàn thành {turnCount} lượt nói
					{feedbackCost > 0 && (
						<span className="inline-flex items-center gap-1.5">
							&nbsp;· Tốn <StaticIcon name="coin" size="xs" className="h-3.5 w-auto -translate-y-0.5" />{" "}
							{feedbackCost} xu
						</span>
					)}
				</p>

				{isPending && (
					<div className="text-center py-8">
						<div className="flex justify-center gap-1.5 mb-3">
							<div className="w-2.5 h-2.5 rounded-full bg-skill-speaking animate-[dotBounce_1.2s_ease-in-out_infinite]" />
							<div
								className="w-2.5 h-2.5 rounded-full bg-skill-speaking animate-[dotBounce_1.2s_ease-in-out_infinite]"
								style={{ animationDelay: "0.2s" }}
							/>
							<div
								className="w-2.5 h-2.5 rounded-full bg-skill-speaking animate-[dotBounce_1.2s_ease-in-out_infinite]"
								style={{ animationDelay: "0.4s" }}
							/>
						</div>
						<p className="text-sm font-bold text-muted">AI đang phân tích hội thoại...</p>
					</div>
				)}

				{isError && (
					<div className="text-center py-6">
						<p className="text-sm text-destructive mb-3">{errorMsg}</p>
						<button type="button" onClick={() => refetch()} className="btn btn-secondary px-6">
							Thử lại
						</button>
					</div>
				)}

				{data && <ReviewContent review={data.data} />}
			</div>
		</div>
	)
}
