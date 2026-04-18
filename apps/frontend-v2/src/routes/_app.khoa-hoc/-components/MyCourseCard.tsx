// Card khóa đã mua ở tab "Khóa của tôi".
// Rule 0.2 style, hiển thị buổi tiếp theo + Zoom link + progress cam kết.

import { Link } from "@tanstack/react-router"
import { AlertTriangle, ArrowRight, CalendarDays, Video } from "lucide-react"
import { commitmentPhaseLabel, computeCommitment } from "#/features/course/lib/commitment"
import { useExamCompletions } from "#/features/course/lib/completion-log"
import type { Enrollment } from "#/features/course/lib/enrollment-store"
import { type Course, isCourseEnded } from "#/mocks/courses"
import { cn } from "#/shared/lib/utils"
import { Button } from "#/shared/ui/button"
import { formatDateVi } from "./course-utils"

interface Props {
	course: Course
	enrollment: Enrollment
}

export function MyCourseCard({ course, enrollment }: Props) {
	const ended = isCourseEnded(course)
	const now = Date.now()
	const upcoming = course.sessions.find((s) => new Date(s.date).getTime() >= now)

	useExamCompletions()
	const commitment = computeCommitment(course, enrollment)
	const violated = commitment.phase === "violated"

	return (
		<div
			className={cn(
				"group relative flex h-full flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm transition-all",
				!ended && !violated && "hover:-translate-y-0.5 hover:shadow-md",
				(ended || violated) && "opacity-80",
			)}
		>
			{/* Badge trạng thái */}
			<div className="flex items-center justify-between gap-2">
				<span
					className={cn(
						"inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
						violated
							? "bg-destructive/10 text-destructive"
							: ended
								? "bg-muted text-muted-foreground"
								: "bg-success/10 text-success",
					)}
				>
					{violated ? "Bị khóa" : ended ? "Đã kết thúc" : "Đang học"}
				</span>
				<CommitmentChip
					phase={commitment.phase}
					completed={commitment.completed}
					required={commitment.required}
				/>
			</div>

			{/* Title + dates */}
			<div className="space-y-1">
				<h3 className="text-lg font-bold leading-tight text-foreground">{course.title}</h3>
				<p className="text-xs text-muted-foreground">
					{formatDateVi(course.startDate)} — {formatDateVi(course.endDate)}
				</p>
			</div>

			{/* Next session hoặc violation hint */}
			<div className="rounded-xl border bg-background p-3 text-sm">
				{violated ? (
					<div className="flex items-start gap-2">
						<AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
						<p className="text-destructive">
							Chưa đủ {commitment.required} bài thi — khóa học đã bị khóa.
						</p>
					</div>
				) : ended ? (
					<p className="text-muted-foreground">
						Khóa học đã kết thúc ngày {formatDateVi(course.endDate)}
					</p>
				) : upcoming ? (
					<div className="flex items-start gap-2">
						<CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" />
						<div className="flex-1">
							<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
								Buổi tiếp theo
							</p>
							<p className="font-medium text-foreground">
								{formatDateVi(upcoming.date)} · {upcoming.startTime}–{upcoming.endTime}
							</p>
							<p className="text-xs text-muted-foreground">Chủ đề: {upcoming.topic}</p>
						</div>
					</div>
				) : (
					<p className="text-muted-foreground">Chưa có buổi học nào sắp tới</p>
				)}
			</div>

			<div className="flex-1" />

			{/* Actions */}
			<div className="flex items-center gap-2">
				{!ended && !violated && (
					<Button asChild size="sm" className="flex-1">
						<a
							href={course.livestreamUrl}
							target="_blank"
							rel="noreferrer"
							className="relative z-10"
						>
							<Video className="size-4" />
							Vào Zoom
						</a>
					</Button>
				)}
				<Link
					to="/khoa-hoc/$courseId"
					params={{ courseId: course.id }}
					className={cn(
						"inline-flex items-center gap-1 text-sm font-medium text-primary transition-colors hover:underline",
						(ended || violated) && "flex-1 justify-start",
					)}
				>
					Chi tiết
					<ArrowRight className="size-3.5" />
				</Link>
			</div>

			{/* Full-card overlay link */}
			<Link
				to="/khoa-hoc/$courseId"
				params={{ courseId: course.id }}
				className="absolute inset-0 rounded-2xl"
				aria-label={`Vào ${course.title}`}
			/>
		</div>
	)
}

function CommitmentChip({
	phase,
	completed,
	required,
}: {
	phase: ReturnType<typeof computeCommitment>["phase"]
	completed: number
	required: number
}) {
	const tone: Record<typeof phase, string> = {
		active: "bg-amber-100 text-amber-800",
		fulfilled: "bg-success/10 text-success",
		violated: "bg-destructive/10 text-destructive",
	}
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
				tone[phase],
			)}
			title={commitmentPhaseLabel(phase)}
		>
			{completed}/{required} bài thi
		</span>
	)
}
