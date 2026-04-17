// Card khóa đã mua ở tab "Khóa của tôi".
// Rule 0.2 style, hiển thị buổi tiếp theo + Zoom link.

import { Link } from "@tanstack/react-router"
import { ArrowRight, CalendarDays, Video } from "lucide-react"
import { Button } from "#/components/ui/button"
import { type Course, isCourseEnded } from "#/lib/mock/courses"
import { cn } from "#/lib/utils"
import { formatDateVi } from "./course-utils"

interface Props {
	course: Course
}

export function MyCourseCard({ course }: Props) {
	const ended = isCourseEnded(course)
	const now = Date.now()
	const upcoming = course.sessions.find((s) => new Date(s.date).getTime() >= now)

	return (
		<div
			className={cn(
				"group relative flex h-full flex-col gap-4 rounded-2xl border bg-card p-6 shadow-sm transition-all",
				!ended && "hover:-translate-y-0.5 hover:shadow-md",
				ended && "opacity-80",
			)}
		>
			{/* Badge trạng thái */}
			<div className="flex items-center justify-between gap-2">
				<span
					className={cn(
						"inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
						ended
							? "bg-muted text-muted-foreground"
							: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300",
					)}
				>
					{ended ? "Đã kết thúc" : "Đang học"}
				</span>
			</div>

			{/* Title + dates */}
			<div className="space-y-1">
				<h3 className="text-lg font-bold leading-tight text-foreground">{course.title}</h3>
				<p className="text-xs text-muted-foreground">
					{formatDateVi(course.startDate)} — {formatDateVi(course.endDate)}
				</p>
			</div>

			{/* Next session info */}
			<div className="rounded-xl border bg-background p-3 text-sm">
				{ended ? (
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
				{!ended && (
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
						ended ? "flex-1 justify-start" : "",
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
