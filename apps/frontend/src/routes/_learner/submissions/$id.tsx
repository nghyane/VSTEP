import {
	Book02Icon,
	Clock01Icon,
	HeadphonesIcon,
	Mic01Icon,
	PencilEdit02Icon,
} from "@hugeicons/core-free-icons"
import type { IconSvgElement } from "@hugeicons/react"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute, Link } from "@tanstack/react-router"
import { Badge } from "@/components/ui/badge"
import { useSubmission } from "@/hooks/use-submissions"
import { cn } from "@/lib/utils"
import type { Skill, SubmissionStatus } from "@/types/api"

export const Route = createFileRoute("/_learner/submissions/$id")({
	component: SubmissionDetailPage,
})

const skillMeta: Record<Skill, { label: string; icon: IconSvgElement }> = {
	listening: { label: "Listening", icon: HeadphonesIcon },
	reading: { label: "Reading", icon: Book02Icon },
	writing: { label: "Writing", icon: PencilEdit02Icon },
	speaking: { label: "Speaking", icon: Mic01Icon },
}

const skillColor: Record<string, string> = {
	listening: "bg-skill-listening/15 text-skill-listening",
	reading: "bg-skill-reading/15 text-skill-reading",
	writing: "bg-skill-writing/15 text-skill-writing",
	speaking: "bg-skill-speaking/15 text-skill-speaking",
}

const statusConfig: Record<
	SubmissionStatus,
	{ label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
	pending: { label: "Đang chờ", variant: "secondary" },
	processing: { label: "Đang xử lý", variant: "secondary" },
	completed: { label: "Hoàn thành", variant: "outline" },
	review_pending: { label: "Chờ chấm", variant: "secondary" },
	failed: { label: "Lỗi", variant: "destructive" },
}

function SubmissionDetailPage() {
	const { id } = Route.useParams()
	const { data, isLoading, isError } = useSubmission(id)

	if (isLoading) {
		return (
			<div className="space-y-4">
				<div className="h-6 w-40 animate-pulse rounded bg-muted" />
				<div className="h-64 animate-pulse rounded-2xl bg-muted" />
			</div>
		)
	}

	if (isError || !data) {
		return (
			<div className="space-y-4">
				<Link to="/submissions" className="text-sm text-muted-foreground hover:text-foreground">
					← Lịch sử bài nộp
				</Link>
				<p className="text-sm text-destructive">Không thể tải dữ liệu. Vui lòng thử lại.</p>
			</div>
		)
	}

	const meta = skillMeta[data.skill]
	const status = statusConfig[data.status]
	const submittedDate = new Date(data.createdAt).toLocaleString("vi-VN")
	const completedDate = data.completedAt ? new Date(data.completedAt).toLocaleString("vi-VN") : null

	return (
		<div className="space-y-6">
			<Link
				to="/submissions"
				className="inline-flex text-sm text-muted-foreground hover:text-foreground"
			>
				← Lịch sử bài nộp
			</Link>

			<h1 className="text-2xl font-bold">Chi tiết bài nộp</h1>

			<div className="space-y-6 rounded-2xl border border-border bg-background p-6">
				{/* Skill + status */}
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className={cn("inline-flex rounded-xl p-2.5", skillColor[data.skill])}>
							<HugeiconsIcon icon={meta.icon} className="size-5" strokeWidth={1.75} />
						</div>
						<div>
							<p className="font-medium">{meta.label}</p>
							{data.band && (
								<Badge variant="outline" className="mt-1">
									{data.band}
								</Badge>
							)}
						</div>
					</div>
					<Badge variant={status.variant}>{status.label}</Badge>
				</div>

				{/* Score */}
				<div className="rounded-xl bg-muted/30 p-4 text-center">
					{data.score != null ? (
						<p className="text-4xl font-bold tabular-nums">{data.score}/10</p>
					) : (
						<p className="text-lg text-muted-foreground">Đang chấm</p>
					)}
				</div>

				{/* Dates */}
				<div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
					<div className="flex items-center gap-1.5">
						<HugeiconsIcon icon={Clock01Icon} className="size-4" />
						<span>Nộp: {submittedDate}</span>
					</div>
					{completedDate && (
						<div className="flex items-center gap-1.5">
							<HugeiconsIcon icon={Clock01Icon} className="size-4" />
							<span>Hoàn thành: {completedDate}</span>
						</div>
					)}
				</div>

				{/* Feedback */}
				{data.feedback && (
					<div className="space-y-2">
						<p className="text-sm font-medium">Nhận xét</p>
						<div className="rounded-xl bg-muted/30 p-4 text-sm leading-relaxed whitespace-pre-wrap">
							{data.feedback}
						</div>
					</div>
				)}

				{/* Answer */}
				{data.answer && (
					<div className="space-y-2">
						<p className="text-sm font-medium">Câu trả lời đã nộp</p>
						<div className="rounded-xl bg-muted/30 p-4 text-sm">
							{"text" in data.answer ? (
								<p className="leading-relaxed whitespace-pre-wrap">{data.answer.text}</p>
							) : "audioUrl" in data.answer ? (
								<div className="space-y-1">
									<p>Audio: {data.answer.durationSeconds}s</p>
								</div>
							) : "answers" in data.answer ? (
								<div className="space-y-1">
									{Object.entries(data.answer.answers).map(([key, val]) => (
										<p key={key}>
											<span className="font-medium">{key}:</span> {val}
										</p>
									))}
								</div>
							) : null}
						</div>
					</div>
				)}
			</div>
		</div>
	)
}
