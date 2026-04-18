// Card hiển thị tiến độ cam kết kỷ luật cho học viên đã mua khóa.
// 3 state: active / fulfilled / violated. 1 progress bar + 1 countdown (nếu còn hạn).

import { Link } from "@tanstack/react-router"
import {
	AlertTriangle,
	ArrowRight,
	CheckCircle2,
	Clock,
	type LucideIcon,
	ShieldCheck,
} from "lucide-react"
import { useEffect, useRef } from "react"
import type { CommitmentStatus } from "#/lib/courses/commitment"
import type { Enrollment } from "#/lib/courses/enrollment-store"
import { pushNotification } from "#/features/notification"
import type { Course } from "#/mocks/courses"
import { cn } from "#/shared/lib/utils"

interface Props {
	course: Course
	enrollment: Enrollment
	status: CommitmentStatus
}

export function CommitmentCard({ course, enrollment, status }: Props) {
	useCommitmentNotifications(course, enrollment, status)

	const progressPct = Math.min(100, Math.round((status.completed / status.required) * 100))
	const tone = pickTone(status)
	const Icon = tone.Icon

	return (
		<section className={cn("rounded-2xl border p-5 shadow-sm", tone.cardBg, tone.cardBorder)}>
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span className={cn("flex size-5 items-center justify-center", tone.iconColor)}>
							<Icon className="size-4" />
						</span>
						<h2 className={cn("text-sm font-bold", tone.titleColor)}>{tone.title}</h2>
					</div>
					<p className="mt-1.5 text-sm leading-relaxed text-foreground">
						<Description status={status} windowDays={course.commitmentWindowDays} />
					</p>
				</div>

				{/* Counter */}
				<div className="flex shrink-0 flex-col items-end">
					<span
						className={cn("text-2xl font-extrabold leading-none tabular-nums", tone.counterColor)}
					>
						{status.completed}
						<span className="text-base font-semibold text-muted-foreground">
							/{status.required}
						</span>
					</span>
					<span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
						Bài thi full-test
					</span>
				</div>
			</div>

			{/* Progress bar */}
			<div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted">
				<div
					className={cn("h-full rounded-full transition-all", tone.barFill)}
					style={{ width: `${progressPct}%` }}
				/>
			</div>

			{/* Footer: countdown + CTA */}
			<div className="mt-4 flex flex-wrap items-center justify-between gap-3">
				<FooterHint status={status} />
				{status.phase === "active" && (
					<Link
						to="/thi-thu"
						className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
					>
						Vào phòng thi
						<ArrowRight className="size-3.5" />
					</Link>
				)}
			</div>
		</section>
	)
}

// ─── Violated banner (hero replacement) ──────────────────────────────────────

export function CommitmentViolatedBanner({ course }: { course: Course }) {
	return (
		<div className="rounded-xl border border-destructive/40 bg-destructive/5 p-4">
			<div className="flex items-start gap-2">
				<AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
				<div className="min-w-0 flex-1 space-y-1">
					<p className="text-sm font-bold text-destructive">Tài khoản khóa học đã bị khóa</p>
					<p className="text-xs text-foreground">
						Bạn chưa hoàn thành đủ {course.requiredFullTests} bài thi full-test theo cam kết. Liên
						hệ trung tâm để được hỗ trợ mở khóa.
					</p>
				</div>
			</div>
		</div>
	)
}

// ─── Pieces ──────────────────────────────────────────────────────────────────

function Description({ status, windowDays }: { status: CommitmentStatus; windowDays: number }) {
	switch (status.phase) {
		case "active":
			return (
				<>
					Hoàn thành <strong>{status.required} bài thi full-test</strong> trong{" "}
					<strong>{windowDays} ngày đầu</strong> của khóa để giữ cam kết đầu ra.
				</>
			)
		case "fulfilled":
			return (
				<>
					Đã hoàn thành đủ {status.required} bài thi — cam kết được giữ. Tiếp tục luyện tập để đạt
					điểm cao nhất.
				</>
			)
		case "violated":
			return (
				<>
					Đã quá hạn mà chưa đủ {status.required} bài. Khóa học của bạn đã bị khóa theo điều khoản
					kỷ luật.
				</>
			)
	}
}

function FooterHint({ status }: { status: CommitmentStatus }) {
	if (status.phase === "fulfilled") {
		return (
			<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
				<CheckCircle2 className="size-3.5" />
				Đã đủ yêu cầu
			</span>
		)
	}
	if (status.phase === "violated") {
		return (
			<span className="inline-flex items-center gap-1.5 text-xs font-semibold text-destructive">
				<AlertTriangle className="size-3.5" />
				Quá hạn {Math.abs(status.daysUntilDeadline)} ngày
			</span>
		)
	}
	const days = Math.max(0, status.daysUntilDeadline)
	const urgent = days <= 3
	return (
		<span
			className={cn(
				"inline-flex items-center gap-1.5 text-xs font-semibold tabular-nums",
				urgent ? "text-destructive" : "text-amber-700 dark:text-amber-400",
			)}
		>
			<Clock className="size-3.5" />
			Còn {days} ngày — cần thêm {status.remaining} bài
		</span>
	)
}

// ─── Visual tone ─────────────────────────────────────────────────────────────

interface Tone {
	title: string
	cardBg: string
	cardBorder: string
	iconColor: string
	titleColor: string
	counterColor: string
	barFill: string
	Icon: LucideIcon
}

function pickTone(status: CommitmentStatus): Tone {
	if (status.phase === "fulfilled") {
		return {
			title: "Đã hoàn thành cam kết",
			cardBg: "bg-emerald-50 dark:bg-emerald-950/20",
			cardBorder: "border-emerald-300 dark:border-emerald-900",
			iconColor: "text-emerald-700 dark:text-emerald-400",
			titleColor: "text-emerald-800 dark:text-emerald-300",
			counterColor: "text-emerald-700 dark:text-emerald-400",
			barFill: "bg-emerald-500",
			Icon: CheckCircle2,
		}
	}
	if (status.phase === "violated") {
		return {
			title: "Vi phạm cam kết",
			cardBg: "bg-destructive/5",
			cardBorder: "border-destructive/40",
			iconColor: "text-destructive",
			titleColor: "text-destructive",
			counterColor: "text-destructive",
			barFill: "bg-destructive",
			Icon: AlertTriangle,
		}
	}
	// active — urgent hóa khi sắp hết hạn.
	if (status.daysUntilDeadline <= 3) {
		return {
			title: "Sắp hết hạn cam kết",
			cardBg: "bg-amber-50 dark:bg-amber-950/20",
			cardBorder: "border-amber-300 dark:border-amber-900",
			iconColor: "text-amber-700 dark:text-amber-400",
			titleColor: "text-amber-800 dark:text-amber-300",
			counterColor: "text-amber-700 dark:text-amber-400",
			barFill: "bg-amber-500",
			Icon: Clock,
		}
	}
	return {
		title: "Đang trong thời hạn cam kết",
		cardBg: "bg-card",
		cardBorder: "border-border",
		iconColor: "text-primary",
		titleColor: "text-primary",
		counterColor: "text-foreground",
		barFill: "bg-primary",
		Icon: ShieldCheck,
	}
}

// ─── Notifications ───────────────────────────────────────────────────────────

function useCommitmentNotifications(
	course: Course,
	enrollment: Enrollment,
	status: CommitmentStatus,
) {
	const lastKey = useRef<string | null>(null)
	useEffect(() => {
		const key = `${course.id}:${enrollment.purchasedAt}:${status.phase}:${clampDays(status.daysUntilDeadline)}`
		if (lastKey.current === key) return
		lastKey.current = key

		if (status.phase === "violated") {
			pushNotification({
				id: `course:violated:${course.id}`,
				title: `Khóa học "${course.title}" đã bị khóa`,
				body: `Bạn chưa hoàn thành đủ ${course.requiredFullTests} bài thi full-test theo cam kết.`,
				iconKey: "trophy",
			})
			return
		}

		if (status.phase === "active" && status.remaining > 0) {
			const days = status.daysUntilDeadline
			if (days <= 1) {
				pushNotification({
					id: `course:deadline-1d:${course.id}`,
					title: `Còn 1 ngày để hoàn thành ${status.remaining} bài thi`,
					body: `Khóa "${course.title}" sẽ khóa tài khoản nếu không đủ ${course.requiredFullTests} bài full-test.`,
					iconKey: "fire",
				})
			} else if (days <= 3) {
				pushNotification({
					id: `course:deadline-3d:${course.id}`,
					title: `Còn ${days} ngày — cần làm thêm ${status.remaining} bài thi`,
					body: `Hoàn thành ngay để không vi phạm cam kết khóa "${course.title}".`,
					iconKey: "fire",
				})
			}
		}
	}, [course, enrollment.purchasedAt, status])
}

function clampDays(days: number): string {
	if (days <= 0) return "overdue"
	if (days <= 1) return "1d"
	if (days <= 3) return "3d"
	return "normal"
}
