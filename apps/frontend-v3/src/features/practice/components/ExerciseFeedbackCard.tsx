import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { submitExerciseFeedback } from "#/features/practice/actions"
import { cn } from "#/lib/utils"

interface Props {
	contentType: string
	contentId: string
}

export function ExerciseFeedbackCard({ contentType, contentId }: Props) {
	const [rating, setRating] = useState(0)
	const [comment, setComment] = useState("")
	const [submitted, setSubmitted] = useState(false)
	const mutation = useMutation({
		mutationFn: () =>
			submitExerciseFeedback({
				content_type: contentType,
				content_id: contentId,
				rating,
				comment: comment.trim() || undefined,
			}),
		onSuccess: () => setSubmitted(true),
	})

	if (submitted) {
		return (
			<div className="rounded-(--radius-card) border-2 border-b-4 border-primary/30 bg-primary-tint p-4 text-center">
				<p className="text-sm font-extrabold text-primary-dark">Cảm ơn bạn đã góp ý!</p>
				<p className="mt-1 text-xs text-muted">Phản hồi giúp đội ngũ cải thiện bài luyện tập.</p>
			</div>
		)
	}

	return (
		<div className="rounded-(--radius-card) border-2 border-b-4 border-border bg-card p-4 text-left">
			<p className="text-sm font-extrabold text-foreground">Bài này hữu ích không?</p>
			<div className="mt-3 flex gap-1.5">
				{[1, 2, 3, 4, 5].map((value) => (
					<button
						key={value}
						type="button"
						onClick={() => setRating(value)}
						disabled={mutation.isPending}
						className={cn(
							"flex size-9 items-center justify-center rounded-full border-2 text-base font-black transition",
							value <= rating
								? "border-coin-dark bg-coin text-white"
								: "border-border bg-surface text-muted hover:border-coin",
						)}
						aria-label={`Đánh giá ${value} sao`}
					>
						★
					</button>
				))}
			</div>
			<textarea
				value={comment}
				onChange={(event) => setComment(event.target.value)}
				disabled={mutation.isPending}
				placeholder="Góp ý thêm nếu bạn muốn..."
				className="mt-3 min-h-20 w-full rounded-(--radius-button) border-2 border-border bg-surface px-3 py-2 text-sm text-foreground outline-none transition focus:border-primary disabled:opacity-60"
				maxLength={1000}
			/>
			<div className="mt-3 flex items-center justify-between gap-3">
				<p className="text-xs font-semibold text-destructive">
					{mutation.isError ? "Không gửi được phản hồi. Vui lòng thử lại." : ""}
				</p>
				<button
					type="button"
					onClick={() => mutation.mutate()}
					disabled={rating === 0 || mutation.isPending}
					className="btn btn-primary text-sm disabled:opacity-60"
				>
					{mutation.isPending ? "Đang gửi…" : "Gửi phản hồi"}
				</button>
			</div>
		</div>
	)
}
