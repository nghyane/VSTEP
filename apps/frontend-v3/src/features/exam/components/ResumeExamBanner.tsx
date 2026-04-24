import { useQuery } from "@tanstack/react-query"
import { Link } from "@tanstack/react-router"
import { Icon } from "#/components/Icon"
import { activeExamSessionQuery } from "#/features/exam/queries"
import { useExamTimer } from "#/features/exam/use-exam-session"

function formatRemaining(seconds: number): string {
	const m = Math.floor(seconds / 60)
	const s = seconds % 60
	return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

interface BannerProps {
	/** Ẩn banner nếu active session thuộc đề này (tránh trùng với CTA inline). */
	hideWhenExamId?: string
}

export function ResumeExamBanner({ hideWhenExamId }: BannerProps = {}) {
	const { data } = useQuery(activeExamSessionQuery)
	const session = data?.data ?? null
	if (!session || !session.exam_id) return null
	if (hideWhenExamId && session.exam_id === hideWhenExamId) return null
	return (
		<Banner
			deadlineAt={session.server_deadline_at}
			examId={session.exam_id}
			examTitle={session.exam_title}
			sessionId={session.id}
		/>
	)
}

function Banner({
	deadlineAt,
	examId,
	examTitle,
	sessionId,
}: {
	deadlineAt: string
	examId: string
	examTitle: string | null
	sessionId: string
}) {
	const remaining = useExamTimer(deadlineAt)
	if (remaining <= 0) return null

	return (
		<div className="flex flex-col gap-3 rounded-(--radius-card) border-2 border-b-4 border-warning/40 bg-warning-tint p-4 sm:flex-row sm:items-center sm:justify-between">
			<div className="flex items-start gap-3">
				<div className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-b-4 border-warning/40 bg-card">
					<Icon name="timer" size="sm" className="text-warning" />
				</div>
				<div className="min-w-0">
					<p className="text-sm font-extrabold text-foreground">
						Bạn có bài thi đang làm dở
						{examTitle && (
							<>
								: <span className="text-warning">{examTitle}</span>
							</>
						)}
					</p>
					<p className="text-xs text-muted">
						Thời gian còn lại:{" "}
						<span className="font-bold tabular-nums text-warning">{formatRemaining(remaining)}</span>
						<span className="mx-1.5">·</span>
						Tiến trình đã được lưu trên thiết bị này
					</p>
				</div>
			</div>

			<Link
				to="/phong-thi/$sessionId"
				params={{ sessionId }}
				search={{ examId }}
				className="btn btn-primary shrink-0 self-start sm:self-auto"
			>
				Tiếp tục làm bài
				<Icon name="lightning" size="xs" className="text-white" />
			</Link>
		</div>
	)
}
