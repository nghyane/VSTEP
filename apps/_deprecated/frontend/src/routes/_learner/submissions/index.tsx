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
import { Skeleton } from "@/components/ui/skeleton"
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
	{ label: string; variant: "default" | "secondary" | "destructive" | "outline"; className: string }
> = {
	pending: {
		label: "Đang chờ",
		variant: "secondary",
		className: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
	},
	processing: {
		label: "Đang xử lý",
		variant: "secondary",
		className: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
	},
	completed: {
		label: "Hoàn thành",
		variant: "outline",
		className:
			"border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300",
	},
	review_pending: {
		label: "Chờ chấm",
		variant: "secondary",
		className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
	},
	failed: {
		label: "Lỗi",
		variant: "destructive",
		className: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
	},
}

function SubmissionRow({ submission }: { submission: SubmissionFull }) {
	const meta = skillMeta[submission.skill]
	const status = statusConfig[submission.status]
	const date = new Date(submission.createdAt).toLocaleDateString("vi-VN")

	return (
		<Link
			to={submission.skill === "writing" ? "/writing-result/$id" : "/submissions/$id"}
			params={{ id: submission.id }}
			className="flex items-center gap-4 rounded-2xl p-4 transition-colors hover:bg-muted/50"
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
						submission.status === "completed"
							? "text-emerald-600 dark:text-emerald-400"
							: submission.status === "failed"
								? "text-red-600 dark:text-red-400"
								: "text-muted-foreground",
					)}
				>
					{submission.score != null ? `${submission.score}/10` : "Đang chấm"}
				</p>
				<Badge variant={status.variant} className={status.className}>
					{status.label}
				</Badge>
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
				<p className="mt-1 text-muted-foreground">Xem lại các bài làm và kết quả</p>
			</div>

			{isLoading ? (
				<div className="space-y-3">
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className="h-20 rounded-2xl" />
					))}
				</div>
			) : isError ? (
				<div className="rounded-2xl bg-muted/50 p-12 text-center">
					<p className="text-lg font-semibold">Đã xảy ra lỗi</p>
					<p className="mt-1 text-muted-foreground">Không thể tải dữ liệu. Vui lòng thử lại.</p>
				</div>
			) : submissions.length === 0 ? (
				<div className="flex flex-col items-center gap-4 rounded-2xl bg-muted/50 py-16">
					<div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
						<HugeiconsIcon icon={Book02Icon} className="size-6" />
					</div>
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
