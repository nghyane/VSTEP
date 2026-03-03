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
import { useSubmissions } from "@/hooks/use-submissions"
import { cn } from "@/lib/utils"
import type { Skill, SubmissionFull, SubmissionStatus } from "@/types/api"

export const Route = createFileRoute("/_learner/submissions/")({
	component: SubmissionsPage,
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

function SubmissionRow({ submission }: { submission: SubmissionFull }) {
	const meta = skillMeta[submission.skill]
	const status = statusConfig[submission.status]
	const date = new Date(submission.createdAt).toLocaleDateString("vi-VN")

	return (
		<Link
			to="/submissions/$id"
			params={{ id: submission.id }}
			className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4 transition-colors hover:border-primary"
		>
			<div className={cn("inline-flex shrink-0 rounded-xl p-2.5", skillColor[submission.skill])}>
				<HugeiconsIcon icon={meta.icon} className="size-5" strokeWidth={1.75} />
			</div>
			<div className="min-w-0 flex-1">
				<p className="font-medium">{meta.label}</p>
				<div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
					<HugeiconsIcon icon={Clock01Icon} className="size-3.5" />
					{date}
				</div>
			</div>
			<div className="flex items-center gap-3">
				<p
					className={cn(
						"text-lg font-bold tabular-nums",
						submission.status === "completed" ? "text-foreground" : "text-muted-foreground",
					)}
				>
					{submission.score != null ? `${submission.score}/10` : "Đang chấm"}
				</p>
				<Badge variant={status.variant}>{status.label}</Badge>
			</div>
		</Link>
	)
}

function SubmissionsPage() {
	const { data, isLoading, isError } = useSubmissions()
	const submissions = data?.data ?? []

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold">Lịch sử bài nộp</h1>
				<p className="mt-1 text-sm text-muted-foreground">Xem lại các bài làm và kết quả</p>
			</div>

			{isLoading ? (
				<div className="space-y-3">
					<div className="h-20 animate-pulse rounded-2xl bg-muted" />
					<div className="h-20 animate-pulse rounded-2xl bg-muted" />
					<div className="h-20 animate-pulse rounded-2xl bg-muted" />
				</div>
			) : isError ? (
				<p className="text-sm text-destructive">Không thể tải dữ liệu. Vui lòng thử lại.</p>
			) : submissions.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-border p-12 text-center">
					<p className="text-muted-foreground">Chưa có bài nộp nào. Hãy làm bài thi đầu tiên!</p>
				</div>
			) : (
				<div className="space-y-3">
					{submissions.map((s) => (
						<SubmissionRow key={s.id} submission={s} />
					))}
				</div>
			)}
		</div>
	)
}
