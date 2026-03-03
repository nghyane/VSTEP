import { CheckmarkCircle02Icon, Clock01Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useSubmitExam } from "@/hooks/use-exam-session"
import { cn } from "@/lib/utils"
import type { Exam, ExamSession } from "@/types/api"
import { SKILL_ORDER, skillColor, skillMeta } from "./skill-meta"
import { useTimer } from "./useTimer"

interface SessionInProgressProps {
	session: ExamSession
	sessionId: string
	exam: Exam | null
}

export function SessionInProgress({ session, sessionId, exam }: SessionInProgressProps) {
	const [confirming, setConfirming] = useState(false)
	const submitExam = useSubmitExam(sessionId)
	const durationMinutes = exam?.blueprint?.durationMinutes ?? 0
	const remaining = useTimer(session.startedAt, durationMinutes)

	function handleSubmit() {
		submitExam.mutate(undefined, {
			onSuccess: () => setConfirming(false),
		})
	}

	const blueprint = exam?.blueprint

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="rounded-2xl bg-muted/30 p-6">
				<h1 className="text-xl font-bold">Phiên thi {exam ? `— Đề ${exam.level}` : ""}</h1>

				<div className="mt-4 grid gap-3 sm:grid-cols-3">
					<InfoItem
						label="Bắt đầu lúc"
						value={new Date(session.startedAt).toLocaleString("vi-VN")}
					/>
					{durationMinutes > 0 && <InfoItem label="Thời gian" value={`${durationMinutes} phút`} />}
					<InfoItem label="Trạng thái" value="Đang làm bài" />
				</div>
			</div>

			{/* Timer */}
			{durationMinutes > 0 && (
				<div
					className={cn(
						"flex items-center gap-3 rounded-xl p-4",
						remaining <= 300 ? "bg-destructive/10 text-destructive" : "bg-muted/30",
					)}
				>
					<HugeiconsIcon icon={Clock01Icon} className="size-5" />
					<span className="font-mono text-lg font-semibold">{formatTime(remaining)}</span>
					<span className="text-sm text-muted-foreground">còn lại</span>
				</div>
			)}

			{/* Skills overview */}
			{blueprint && (
				<div className="space-y-3">
					<h2 className="font-semibold">Các phần thi</h2>
					<div className="grid gap-3 sm:grid-cols-2">
						{SKILL_ORDER.map((skill) => {
							const section = blueprint[skill]
							if (!section?.questionIds.length) return null
							const meta = skillMeta[skill]
							return (
								<div
									key={skill}
									className={cn("flex items-center gap-3 rounded-xl p-4", skillColor[skill])}
								>
									<HugeiconsIcon icon={meta.icon} className="size-5" />
									<span className="font-medium">{meta.label}</span>
									<span className="ml-auto text-sm">{section.questionIds.length} câu</span>
								</div>
							)
						})}
					</div>
				</div>
			)}

			{/* Submit */}
			{confirming ? (
				<div className="rounded-xl border border-border p-5 space-y-4">
					<p className="font-medium">Bạn có chắc muốn nộp bài?</p>
					<p className="text-sm text-muted-foreground">
						Sau khi nộp, bạn không thể chỉnh sửa câu trả lời.
					</p>
					<div className="flex gap-3">
						<Button
							variant="outline"
							onClick={() => setConfirming(false)}
							disabled={submitExam.isPending}
						>
							Hủy
						</Button>
						<Button onClick={handleSubmit} disabled={submitExam.isPending}>
							<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
							{submitExam.isPending ? "Đang nộp..." : "Nộp bài"}
						</Button>
					</div>
				</div>
			) : (
				<Button onClick={() => setConfirming(true)} className="gap-2">
					<HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4" />
					Nộp bài
				</Button>
			)}
		</div>
	)
}

function InfoItem({ label, value }: { label: string; value: string }) {
	return (
		<div>
			<p className="text-xs text-muted-foreground">{label}</p>
			<p className="mt-0.5 font-medium">{value}</p>
		</div>
	)
}

function formatTime(seconds: number): string {
	if (seconds <= 0) return "00:00"
	const m = Math.floor(seconds / 60)
	const s = seconds % 60
	return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}
