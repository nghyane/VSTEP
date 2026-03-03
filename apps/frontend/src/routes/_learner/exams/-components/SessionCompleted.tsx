import { HugeiconsIcon } from "@hugeicons/react"
import { Link } from "@tanstack/react-router"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Exam, ExamSession, Skill } from "@/types/api"
import { skillColor, skillMeta } from "./skill-meta"

interface SessionCompletedProps {
	session: ExamSession
	exam: Exam | null
}

const statusLabel: Record<string, string> = {
	submitted: "Đã nộp",
	completed: "Hoàn thành",
	abandoned: "Đã hủy",
}

export function SessionCompleted({ session, exam }: SessionCompletedProps) {
	const scores: { skill: Skill; score: number | null }[] = [
		{ skill: "listening", score: session.listeningScore },
		{ skill: "reading", score: session.readingScore },
		{ skill: "writing", score: session.writingScore },
		{ skill: "speaking", score: session.speakingScore },
	]

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="rounded-2xl bg-muted/30 p-6">
				<h1 className="text-xl font-bold">Kết quả thi {exam ? `— Đề ${exam.level}` : ""}</h1>
				<div className="mt-2 flex items-center gap-4">
					<span className="text-sm text-muted-foreground">
						{statusLabel[session.status] ?? session.status}
					</span>
					{session.completedAt && (
						<span className="text-sm text-muted-foreground">
							{new Date(session.completedAt).toLocaleString("vi-VN")}
						</span>
					)}
				</div>
			</div>

			{/* Overall score */}
			{session.overallScore !== null && (
				<div className="rounded-2xl bg-primary/10 p-6 text-center">
					<p className="text-sm font-medium text-muted-foreground">Điểm tổng</p>
					<p className="mt-1 text-4xl font-bold text-primary">
						{session.overallScore}
						<span className="text-lg font-normal text-muted-foreground">/10</span>
					</p>
				</div>
			)}

			{/* Skill scores */}
			<div className="grid gap-3 sm:grid-cols-2">
				{scores.map(({ skill, score }) => {
					const meta = skillMeta[skill]
					return (
						<div
							key={skill}
							className={cn("flex items-center gap-3 rounded-xl p-4", skillColor[skill])}
						>
							<HugeiconsIcon icon={meta.icon} className="size-5" />
							<span className="font-medium">{meta.label}</span>
							<span className="ml-auto font-semibold">
								{score !== null ? `${score}/10` : "Đang chấm"}
							</span>
						</div>
					)
				})}
			</div>

			{/* Back link */}
			<Link to="/dashboard">
				<Button variant="outline" className="gap-2">
					Về danh sách bài thi
				</Button>
			</Link>
		</div>
	)
}
