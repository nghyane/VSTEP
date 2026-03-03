import { Award02Icon, UserAdd01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { createFileRoute } from "@tanstack/react-router"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAssignReviewer, useAutoGrade } from "@/hooks/use-admin-submissions"
import { useSubmissions } from "@/hooks/use-submissions"
import { cn } from "@/lib/utils"
import type { Skill, SubmissionFull, SubmissionStatus } from "@/types/api"

export const Route = createFileRoute("/admin/submissions")({
	component: AdminSubmissionsPage,
})

const skillMeta: Record<Skill, { label: string; color: string }> = {
	listening: { label: "Nghe", color: "bg-skill-listening/15 text-skill-listening" },
	reading: { label: "Đọc", color: "bg-skill-reading/15 text-skill-reading" },
	writing: { label: "Viết", color: "bg-skill-writing/15 text-skill-writing" },
	speaking: { label: "Nói", color: "bg-skill-speaking/15 text-skill-speaking" },
}

const statusLabels: Record<
	SubmissionStatus,
	{ label: string; variant: "secondary" | "outline" | "destructive" }
> = {
	pending: { label: "Đang chờ", variant: "secondary" },
	processing: { label: "Đang xử lý", variant: "secondary" },
	completed: { label: "Hoàn thành", variant: "outline" },
	review_pending: { label: "Chờ chấm", variant: "secondary" },
	failed: { label: "Lỗi", variant: "destructive" },
}

const skills: Skill[] = ["listening", "reading", "writing", "speaking"]

function AdminSubmissionsPage() {
	const [skill, setSkill] = useState<string>("")
	const [status, setStatus] = useState<string>("")

	const { data, isLoading, isError } = useSubmissions({
		skill: skill || undefined,
		status: status || undefined,
	})
	const submissions = data?.data ?? []
	const autoGrade = useAutoGrade()
	const assignReviewer = useAssignReviewer()

	function handleAutoGrade(id: string) {
		autoGrade.mutate(id)
	}

	function handleAssignReviewer(id: string) {
		const reviewerId = window.prompt("Nhập ID người chấm:")
		if (reviewerId?.trim()) {
			assignReviewer.mutate({ id, reviewerId: reviewerId.trim() })
		}
	}

	return (
		<div className="space-y-6">
			<h1 className="text-2xl font-bold">Quản lý bài nộp</h1>

			<div className="flex flex-wrap items-center gap-3">
				<div className="flex flex-wrap items-center gap-2">
					<Button
						size="xs"
						variant={skill === "" ? "default" : "outline"}
						onClick={() => setSkill("")}
					>
						Tất cả
					</Button>
					{skills.map((s) => (
						<Button
							key={s}
							size="xs"
							variant={skill === s ? "default" : "outline"}
							onClick={() => setSkill(s)}
						>
							{skillMeta[s].label}
						</Button>
					))}
				</div>
				<select
					value={status}
					onChange={(e) => setStatus(e.target.value)}
					className="h-7 rounded-lg border border-border bg-background px-2 text-xs outline-none focus:border-primary"
				>
					<option value="">Tất cả trạng thái</option>
					{(Object.keys(statusLabels) as SubmissionStatus[]).map((s) => (
						<option key={s} value={s}>
							{statusLabels[s].label}
						</option>
					))}
				</select>
			</div>

			{isLoading ? (
				<div className="space-y-2">
					{[1, 2, 3].map((i) => (
						<div key={i} className="h-14 animate-pulse rounded-2xl bg-muted" />
					))}
				</div>
			) : isError ? (
				<p className="text-sm text-destructive">Không thể tải dữ liệu. Vui lòng thử lại.</p>
			) : submissions.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-border p-12 text-center">
					<p className="text-muted-foreground">Chưa có bài nộp nào.</p>
				</div>
			) : (
				<div className="overflow-hidden rounded-2xl border border-border">
					<table className="w-full text-sm">
						<thead>
							<tr className="border-b border-border bg-muted/50">
								<th className="px-4 py-3 text-left font-medium">Kỹ năng</th>
								<th className="px-4 py-3 text-left font-medium">Điểm</th>
								<th className="px-4 py-3 text-left font-medium">Band</th>
								<th className="px-4 py-3 text-left font-medium">Trạng thái</th>
								<th className="px-4 py-3 text-left font-medium">Ngày nộp</th>
								<th className="px-4 py-3 text-right font-medium">Hành động</th>
							</tr>
						</thead>
						<tbody>
							{submissions.map((sub) => (
								<SubmissionRow
									key={sub.id}
									submission={sub}
									onAutoGrade={handleAutoGrade}
									onAssignReviewer={handleAssignReviewer}
									isGrading={autoGrade.isPending}
									isAssigning={assignReviewer.isPending}
								/>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	)
}
function SubmissionRow({
	submission,
	onAutoGrade,
	onAssignReviewer,
	isGrading,
	isAssigning,
}: {
	submission: SubmissionFull
	onAutoGrade: (id: string) => void
	onAssignReviewer: (id: string) => void
	isGrading: boolean
	isAssigning: boolean
}) {
	const meta = skillMeta[submission.skill]
	const st = statusLabels[submission.status]
	const canAutoGrade =
		(submission.skill === "listening" || submission.skill === "reading") &&
		submission.status === "pending"

	return (
		<tr className="border-b border-border last:border-b-0">
			<td className="px-4 py-3">
				<Badge className={cn("border-0", meta.color)}>{meta.label}</Badge>
			</td>
			<td className="px-4 py-3 tabular-nums font-medium">
				{submission.score != null ? submission.score : "—"}
			</td>
			<td className="px-4 py-3">{submission.band ?? "—"}</td>
			<td className="px-4 py-3">
				<Badge variant={st.variant}>{st.label}</Badge>
			</td>
			<td className="px-4 py-3 text-muted-foreground">
				{new Date(submission.createdAt).toLocaleDateString("vi-VN")}
			</td>
			<td className="px-4 py-3 text-right">
				<div className="flex items-center justify-end gap-1">
					{canAutoGrade && (
						<Button
							size="xs"
							variant="outline"
							disabled={isGrading}
							onClick={() => onAutoGrade(submission.id)}
						>
							<HugeiconsIcon icon={Award02Icon} className="size-3" />
							Chấm tự động
						</Button>
					)}
					<Button
						size="xs"
						variant="outline"
						disabled={isAssigning}
						onClick={() => onAssignReviewer(submission.id)}
					>
						<HugeiconsIcon icon={UserAdd01Icon} className="size-3" />
						Gán reviewer
					</Button>
				</div>
			</td>
		</tr>
	)
}
